using Desktop.BLL.Interface;
using Desktop.DAL.Interface;
using Desktop.Domain.Models;
using Newtonsoft.Json;

namespace Desktop.BLL.Service {
    public class TwseService(IUnitOfWork unitOfWork, IHttpClientFactory httpClientFactory) : ITwseService {
        public async Task<TrendAnalysisResultModel> StockAsync(WindowInfoParamModel param) {
            DateTime today = DateTime.Today;
            TrendAnalysisResultModel result = new TrendAnalysisResultModel();
            for (int i = 0; i < 3; i++) {
                int year = today.Year;
                int month = today.Month - i;
                if (month == 0) {
                    year--;
                    month = 12;
                }

                List<StockDataModel> prices = await GetClosePricesAsync(param.Id, $"{year:0000}{month:00}01");
                result.StockDatas.AddRange(prices);
            }

            result.StockDatas = result.StockDatas.Where(p => p.Close > 0).OrderBy(p => p.Date).ToList();

            List<Task> tasks = [
                Task.Run(()=> CalculateMA(result.StockDatas)),
                Task.Run(()=> CalculateRSI(result.StockDatas, 14)),
                Task.Run(()=> CalculateMACD(result.StockDatas)),
            ];

            await Task.WhenAll(tasks);
            result.Suggestion = AnalyzeResult(result.StockDatas);

            return result;
        }

        private async Task<List<StockDataModel>> GetClosePricesAsync(string stockNo, string yyyymmdd) {
            List<StockDataModel> results = new List<StockDataModel>();

            try {
                var c = httpClientFactory.CreateClient();
                c.BaseAddress = new Uri("https://www.twse.com.tw");
                var response = await c.GetAsync($"/exchangeReport/STOCK_DAY?response=json&date={yyyymmdd}&stockNo={stockNo}");
                string data = response.Content.ReadAsStringAsync().Result;
                var doc = JsonConvert.DeserializeObject<StockHistoryModel>(data);

                foreach (var row in doc.data) {
                    if (DateTime.TryParseExact(ConvertDate(row[0]), "yyyy/MM/dd", null, System.Globalization.DateTimeStyles.None, out var date)) {
                        results.Add(new StockDataModel {
                            Date = date,
                            Open = decimal.TryParse(row[3].Replace(",", ""), out var open) ? open : 0,
                            High = decimal.TryParse(row[4].Replace(",", ""), out var high) ? high : 0,
                            Low = decimal.TryParse(row[5].Replace(",", ""), out var low) ? low : 0,
                            Close = decimal.TryParse(row[6].Replace(",", ""), out var close) ? close : 0,
                            Volume = long.TryParse(row[8].Replace(",", ""), out var volume) ? volume : 0
                        });
                    }
                }

            } catch (Exception) {
                throw;
            }

            return results;
        }

        private string ConvertDate(string rocDate) {
            var parts = rocDate.Split('/');
            int year = int.Parse(parts[0]) + 1911;
            return $"{year}/{parts[1]}/{parts[2]}";
        }

        private string AnalyzeResult(List<StockDataModel> data) {
            string result = "";
            StockDataModel lastData = data.Last();

            #region MA 分析
            decimal? ma5 = lastData.MA5;
            decimal? ma20 = lastData.MA20;
            decimal? prev_ma5 = data.SkipLast(1).Last().MA5;
            decimal? prev_ma20 = data.SkipLast(1).Last().MA20;

            if (ma5 != null && ma20 != null && prev_ma5 != null && prev_ma20 != null) {
                result += $"\n📊 均線指標";
                result += $"\n目前5日均線：{ma5:F2}";
                result += $"\n目前20日均線：{ma20:F2}";
                result += $"\n昨日5日均線：{prev_ma5:F2}";
                result += $"\n昨日20日均線：{prev_ma20:F2}";

                if (prev_ma5 < prev_ma20 && ma5 > ma20) {
                    result += "\n✅ 黃金交叉出現：可考慮進場";
                } else if (prev_ma5 > prev_ma20 && ma5 < ma20) {
                    result += "\n⚠️ 死亡交叉出現：可考慮出場";
                } else {
                    result += "\n❌ 尚未出現黃金/死亡交叉";
                }
            } else {
                result += "\n📉 資料不足，無法計算 20MA";
            }
            #endregion

            #region RSI 分析
            decimal? rsi = lastData.RSI;
            if (rsi.HasValue) {
                result += $"\n\n📈 RSI指標 (14日)";
                result += $"\n目前RSI值：{rsi:F2}";

                if (rsi > 70) {
                    result += "\n🔥 訊號：超買區 (Overbought)，市場可能過熱，留意回檔風險。";
                } else if (rsi < 30) {
                    result += "\n💧 訊號：超賣區 (Oversold)，賣壓漸弱，留意反彈機會。";
                } else {
                    result += "\n⚖️ 訊號：中性區 (30-70)。";
                }
            } else {
                result += "\n\n📈 RSI指標 (14日)";
                result += "\n資料不足，無法計算 RSI。";
            }
            #endregion

            #region MACD 分析
            if (lastData.DIF.HasValue && lastData.MACD.HasValue) {
                decimal? dif = lastData.DIF;
                decimal? macd = lastData.MACD;
                decimal osc = lastData.OSC.HasValue ? lastData.OSC.Value : 0m;

                result += "\n\n📊 MACD 指標 (12, 26, 9)";
                result += $"\nDIF (MACD 線)：{dif:F2}";
                result += $"\nMACD (訊號線)：{macd:F2}";
                result += $"\nOSC (柱狀圖)：{osc:F2}";

                if (data.Count >= 2) {
                    var secondLastData = data[data.Count - 2];
                    if (secondLastData.DIF.HasValue && secondLastData.MACD.HasValue) {
                        decimal prevDif = secondLastData.DIF.Value;
                        decimal prevMacdSignal = secondLastData.MACD.Value;

                        // 黃金交叉：DIF 向上突破 MACD 訊號線
                        if (dif > macd && prevDif <= prevMacdSignal) {
                            result += "\n✨ **訊號：黃金交叉 (Golden Cross)** - 短期動能轉強，留意買入機會！";
                        }
                        // 死亡交叉：DIF 向下突破 MACD 訊號線
                        else if (dif < macd && prevDif >= prevMacdSignal) {
                            result += "\n💀 **訊號：死亡交叉 (Death Cross)** - 短期動能轉弱，留意賣出風險！";
                        }
                        // 其他情況：持續多頭或空頭
                        else if (dif > macd) {
                            result += "\n🟢 **趨勢：多頭排列** - DIF 線在訊號線之上，市場趨勢偏多。";
                        } else if (dif < macd) {
                            result += "\n🔴 **趨勢：空頭排列** - DIF 線在訊號線之下，市場趨勢偏空。";
                        }
                    } else {
                        // 如果倒數第二筆資料還沒有MACD值，則無法判斷交叉
                        result += "\n⚠️ 交叉訊號判斷：資料不足。";
                    }
                } else {
                    // 如果總資料筆數不足兩筆
                    result += "\n⚠️ 交叉訊號判斷：資料不足。";
                }

                // 根據 OSC 柱狀圖判斷動能
                if (osc > 0) {
                    result += "\n📈 **動能：買方動能增強** - 柱狀圖在零軸上方，且越高代表多頭動能越強。";
                } else if (osc < 0) {
                    result += "\n📉 **動能：賣方動能增強** - 柱狀圖在零軸下方，且越低代表空頭動能越強。";
                } else {
                    result += "\n🔄 **動能：趨勢不明** - 柱狀圖在零軸附近，動能較弱。";
                }

            } else {
                result += "\n\n📊 MACD 指標 (12, 26, 9)";
                result += "\n資料不足，無法計算 MACD。";
            }
            #endregion

            return result;
        }
        /// <summary>
        /// MA
        /// </summary>
        /// <param name="data"></param>
        private void CalculateMA(List<StockDataModel> data) {
            for (int i = 4; i < data.Count; i++) {
                data[i].MA5 = data.Skip(i - 4).Take(5).Average(a => a.Close);
                if (i >= 19) {
                    data[i].MA20 = data.Skip(i - 19).Take(20).Average(a => a.Close);
                }
            }
        }
        /// <summary>
        /// RSI
        /// </summary>
        /// <param name="data"></param>
        /// <param name="period"></param>
        private void CalculateRSI(List<StockDataModel> data, int period) {
            if (data.Count <= period) {
                return;
            }

            // 1. 計算第一個 RSI 值 (第 period+1 筆資料)
            // 先計算前 14 天的總漲跌幅
            decimal gain = 0, loss = 0;
            for (int i = 1; i <=period; i++) {
                decimal change = data[i].Close - data[i - 1].Close;
                if (change > 0) {
                    gain += change;
                } else {
                    loss += Math.Abs(change);
                }
            }

            decimal avgGain = gain / period;
            decimal avgLoss = loss / period;

            // 計算 RS (相對強度) 與 RSI
            if (avgLoss > 0) {
                decimal rs = avgGain / avgLoss;
                data[period].RSI = 100 - (100 / (1 + rs));
            } else {
                data[period].RSI = 100; //如果平均跌幅為 0，RSI 為 100
            }

            // 2. 計算後續的 RSI 值 (使用平滑移動平均)
            for (int i = period + 1; i < data.Count; i++) {
                decimal change = data[i].Close - data[i - 1].Close;
                decimal currentGain = change > 0 ? change : 0;
                decimal currentLoss = change < 0 ? Math.Abs(change) : 0;

                avgGain = (avgGain * (period - 1) + currentGain) / period;
                avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

                data[i].RSI = avgLoss > 0 ? 100 - (100 / (1 + avgGain / avgLoss)) : 100;
            }

        }
        /// <summary>
        /// MACD
        /// </summary>
        /// <param name="stockList"></param>
        private void CalculateMACD(List<StockDataModel> stockList) {
            const int shortPeriod = 12;
            const int longPeriod = 26;
            const int signalPeriod = 9;

            decimal? prevEMA12 = null;
            decimal? prevEMA26 = null;
            decimal? prevMACD = null;

            foreach (var stock in stockList) {
                decimal close = stock.Close;

                // EMA12 計算
                if (prevEMA12 == null)
                    stock.EMA12 = close; // 第一筆用收盤價初始化
                else
                    stock.EMA12 = prevEMA12 + (close - prevEMA12) * (2m / (shortPeriod + 1));

                // EMA26 計算
                if (prevEMA26 == null)
                    stock.EMA26 = close;
                else
                    stock.EMA26 = prevEMA26 + (close - prevEMA26) * (2m / (longPeriod + 1));

                // DIF = EMA12 - EMA26
                if (stock.EMA12.HasValue && stock.EMA26.HasValue)
                    stock.DIF = stock.EMA12 - stock.EMA26;

                // MACD = DIF 的 9 日 EMA
                if (stock.DIF.HasValue) {
                    if (prevMACD == null)
                        stock.MACD = stock.DIF; // 初始化
                    else
                        stock.MACD = prevMACD + (stock.DIF - prevMACD) * (2m / (signalPeriod + 1));
                }

                // OSC = DIF - MACD
                if (stock.DIF.HasValue && stock.MACD.HasValue)
                    stock.OSC = stock.DIF - stock.MACD;

                // 儲存上一筆資料
                prevEMA12 = stock.EMA12;
                prevEMA26 = stock.EMA26;
                prevMACD = stock.MACD;
            }
        }

    }
}
