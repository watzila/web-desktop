export default {
    "/api/Twse/Index": async (ctx) => {
        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: null,
            js: "twse"
        };
    },
    "/api/Twse/Stock": async (ctx, data) => {
        const result = await stockAnalysis(data.id);

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: result,
            js: null
        };
    }
};

async function stockAnalysis(stockId) {
    const today = new Date();
    const result = {
        stockDatas: [],
        suggestion: '',
        comprehensiveAnalysis: null
    };

    // 擴展到6個月數據以獲得更準確的技術指標
    for (let i = 0; i < 6; i++) {
        let year = today.getFullYear();
        let month = today.getMonth() + 1 - i;
        if (month <= 0) {
            year--;
            month += 12;
        }
        const dateStr = `${year}${month.toString().padStart(2, '0')}01`;
        const prices = await getClosePrices(stockId, dateStr);
        result.stockDatas.push(...prices);
    }

    result.stockDatas = result.stockDatas.filter(p => p.close > 0).sort((a, b) => new Date(a.date) - new Date(b.date));

    //技術指標計算
    const financialIndicators = new FinancialIndicators();
    // 計算所有技術指標
    financialIndicators.calculateMA(result.stockDatas, [5, 10, 20, 60]);
    financialIndicators.calculateEMA(result.stockDatas, 12);
    financialIndicators.calculateEMA(result.stockDatas, 26);
    financialIndicators.calculateRSI(result.stockDatas, 14);
    financialIndicators.calculateMACD(result.stockDatas);
    financialIndicators.calculateBollingerBands(result.stockDatas);
    financialIndicators.calculateKD(result.stockDatas);
    financialIndicators.calculateVolumeIndicators(result.stockDatas);

    // 綜合分析
    result.comprehensiveAnalysis = financialIndicators.comprehensiveAnalysis(result.stockDatas);
    
    // 生成建議
    result.suggestion = analyzeResult(result.stockDatas, result.comprehensiveAnalysis);
    
    return result;
}

async function getClosePrices(stockNo, yyyymmdd) {
    const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${yyyymmdd}&stockNo=${stockNo}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
    const result = [];
    for (const row of data.data) {
        const date = convertDate(row[0]);
        if (!date) continue;

        result.push({
            date,
            open: parseFloat(row[3].replace(/,/g, '')) || 0,
            high: parseFloat(row[4].replace(/,/g, '')) || 0,
            low: parseFloat(row[5].replace(/,/g, '')) || 0,
            close: parseFloat(row[6].replace(/,/g, '')) || 0,
            volume: parseInt(row[8].replace(/,/g, '')) || 0,
            ma5: null,
            ma20: null,
            rsi: null,
            ema12: null,
            ema26: null,
            dif: null,
            macd: null,
            osc: null,
            ma10: null,
            ma60: null,
            priceChange: null,
            gain: null,
            loss: null,
            bbMiddle: null,
            bbUpper: null,
            bbLower: null,
            bbWidth: null,
            bbPosition: null,
            rsv: null,
            k: null,
            d: null,
            vma5: null,
            vma20: null,
            priceVolumeRelation: ""
        });
    }
    return result;
}

function convertDate(rocDateStr) {
    const parts = rocDateStr.split('/');
    const year = parseInt(parts[0], 10) + 1911;
    return `${year}/${parts[1]}/${parts[2]}`;
}

function analyzeResult(data) {
    let result = "";
    // 檢查數據是否為空
    if (!data || data.length === 0) {
        return "沒有足夠的資料可以進行分析。";
    }

    const lastData = data[data.length - 1]; // 獲取最新一筆數據

    // --- MA 分析 ---
    // 確保有足夠的數據來獲取前一天的 MA 值
    if (data.length >= 2) {
        const ma5 = lastData.ma5;
        const ma20 = lastData.ma20;
        const prev_ma5 = data[data.length - 2].ma5; // 獲取倒數第二筆數據的 ma5
        const prev_ma20 = data[data.length - 2].ma20; // 獲取倒數第二筆數據的 ma20

        if (ma5 !== null && ma20 !== null && prev_ma5 !== null && prev_ma20 !== null) {
            result += `📊 均線指標`;
            result += `\n目前5日均線：${ma5.toFixed(2)}`;
            result += `\n目前20日均線：${ma20.toFixed(2)}`;
            result += `\n昨日5日均線：${prev_ma5.toFixed(2)}`;
            result += `\n昨日20日均線：${prev_ma20.toFixed(2)}`;

            if (prev_ma5 < prev_ma20 && ma5 > ma20) {
                result += "\n✅ 黃金交叉出現：可考慮進場";
            } else if (prev_ma5 > prev_ma20 && ma5 < ma20) {
                result += "\n⚠️ 死亡交叉出現：可考慮出場";
            } else {
                result += "\n❌ 尚未出現黃金/死亡交叉";
            }
        } else {
            result += "\n📉 資料不足，無法計算 20MA (MA值為空)。";
        }
    } else {
        result += "\n📉 資料不足，無法計算 20MA (數據量不足)。";
    }


    // --- rsi 分析 ---
    const rsi = lastData.rsi;
    if (rsi !== null) {
        result += `\n\n📈 RSI指標 (14日)`;
        result += `\n目前RSI值：${rsi.toFixed(2)}`;

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

    // --- macd 分析 ---
    // 檢查最新一筆數據是否有 macd 相關值
    if (lastData.dif !== null && lastData.macd !== null) {

        const dif = lastData.dif;
        const macd = lastData.macd;
        const osc = (lastData.osc !== null && lastData.osc !== undefined) ? lastData.osc : 0;

        result += "\n\n📊 MACD 指標 (12, 26, 9)";
        result += `\nDIF (MACD 線)：${dif.toFixed(2)}`;
        result += `\nMACD (訊號線)：${macd.toFixed(2)}`;
        result += `\nOSC (柱狀圖)：${osc.toFixed(2)}`;

        // 判斷 macd 交叉訊號需要至少兩筆數據
        if (data.length >= 2) {
            const secondLastData = data[data.length - 2];
            if (secondLastData.dif !== null && secondLastData.macd !== null) {

                const prevDif = secondLastData.dif;
                const prevMacdSignal = secondLastData.macd;

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

    // --- 布林通道分析 ---
    if (lastData.bbMiddle !== null && lastData.bbUpper !== null && lastData.bbLower !== null) {
        result += "\n\n📈 布林通道指標 (20日, 2倍標準差)";
        result += `\n上軌：${lastData.bbUpper.toFixed(2)}`;
        result += `\n中軌：${lastData.bbMiddle.toFixed(2)}`;
        result += `\n下軌：${lastData.bbLower.toFixed(2)}`;
        result += `\n目前價位：${lastData.close.toFixed(2)}`;
        result += `\n通道位置：${(lastData.bbPosition * 100).toFixed(1)}%`;

        if (lastData.bbPosition > 0.8) {
            result += "\n🔥 訊號：接近上軌，可能遇到阻力，留意回檔風險。";
        } else if (lastData.bbPosition < 0.2) {
            result += "\n💧 訊號：接近下軌，可能獲得支撐，留意反彈機會。";
        } else if (lastData.bbPosition > 0.6) {
            result += "\n📈 訊號：偏向上軌，趨勢偏強。";
        } else if (lastData.bbPosition < 0.4) {
            result += "\n📉 訊號：偏向下軌，趨勢偏弱。";
        } else {
            result += "\n⚖️ 訊號：位於通道中央，趨勢中性。";
        }

        // 通道寬度分析
        const bbWidthRatio = lastData.bbWidth / lastData.bbMiddle;
        if (bbWidthRatio > 0.1) {
            result += "\n📏 通道寬度：較寬，市場波動較大。";
        } else if (bbWidthRatio < 0.05) {
            result += "\n📏 通道寬度：較窄，市場波動較小，可能醞釀突破。";
        } else {
            result += "\n📏 通道寬度：正常。";
        }
    } else {
        result += "\n\n📈 布林通道指標 (20日, 2倍標準差)";
        result += "\n資料不足，無法計算布林通道。";
    }

    // --- KD 指標分析 ---
    if (lastData.k !== null && lastData.d !== null) {
        result += "\n\n📊 KD 指標 (9, 3, 3)";
        result += `\nK值：${lastData.k.toFixed(2)}`;
        result += `\nD值：${lastData.d.toFixed(2)}`;

        // KD 交叉分析
        if (data.length >= 2) {
            const prevData = data[data.length - 2];
            if (prevData.k !== null && prevData.d !== null) {
                if (prevData.k <= prevData.d && lastData.k > lastData.d) {
                    result += "\n✨ 訊號：K線向上突破D線 (黃金交叉)，短期偏多。";
                } else if (prevData.k >= prevData.d && lastData.k < lastData.d) {
                    result += "\n💀 訊號：K線向下跌破D線 (死亡交叉)，短期偏空。";
                } else if (lastData.k > lastData.d) {
                    result += "\n🟢 趨勢：K線在D線之上，短期趨勢偏多。";
                } else {
                    result += "\n🔴 趨勢：K線在D線之下，短期趨勢偏空。";
                }
            }
        }

        // KD 超買超賣分析
        if (lastData.k > 80 && lastData.d > 80) {
            result += "\n🔥 訊號：KD進入超買區 (>80)，留意回檔風險。";
        } else if (lastData.k < 20 && lastData.d < 20) {
            result += "\n💧 訊號：KD進入超賣區 (<20)，留意反彈機會。";
        } else if (lastData.k > 70 || lastData.d > 70) {
            result += "\n⚠️ 訊號：KD偏高，接近超買區。";
        } else if (lastData.k < 30 || lastData.d < 30) {
            result += "\n⚠️ 訊號：KD偏低，接近超賣區。";
        } else {
            result += "\n⚖️ 訊號：KD處於中性區間。";
        }
    } else {
        result += "\n\n📊 KD 指標 (9, 3, 3)";
        result += "\n資料不足，無法計算 KD。";
    }

    // --- EMA 指標分析 ---
    if (lastData.ema12 !== null && lastData.ema26 !== null) {
        result += "\n\n📈 EMA 指標";
        result += `\nEMA12：${lastData.ema12.toFixed(2)}`;
        result += `\nEMA26：${lastData.ema26.toFixed(2)}`;
        result += `\n目前價位：${lastData.close.toFixed(2)}`;

        // EMA 排列分析
        if (lastData.ema12 > lastData.ema26) {
            result += "\n🟢 趨勢：EMA12 > EMA26，短期趨勢向上。";
        } else {
            result += "\n🔴 趨勢：EMA12 < EMA26，短期趨勢向下。";
        }

        // 價格與EMA關係
        if (lastData.close > lastData.ema12 && lastData.close > lastData.ema26) {
            result += "\n📈 位置：價格位於兩條EMA之上，多頭格局。";
        } else if (lastData.close < lastData.ema12 && lastData.close < lastData.ema26) {
            result += "\n📉 位置：價格位於兩條EMA之下，空頭格局。";
        } else {
            result += "\n⚖️ 位置：價格介於兩條EMA之間，盤整格局。";
        }
    } else {
        result += "\n\n📈 EMA 指標";
        result += "\n資料不足，無法計算 EMA。";
    }

    // --- 多週期均線分析 ---
    if (lastData.ma10 !== null && lastData.ma60 !== null) {
        result += "\n\n📊 多週期均線分析";
        result += `\nMA5：${lastData.ma5 ? lastData.ma5.toFixed(2) : 'N/A'}`;
        result += `\nMA10：${lastData.ma10.toFixed(2)}`;
        result += `\nMA20：${lastData.ma20 ? lastData.ma20.toFixed(2) : 'N/A'}`;
        result += `\nMA60：${lastData.ma60.toFixed(2)}`;

        // 均線排列分析
        const mas = [
            { name: 'MA5', value: lastData.ma5 },
            { name: 'MA10', value: lastData.ma10 },
            { name: 'MA20', value: lastData.ma20 },
            { name: 'MA60', value: lastData.ma60 }
        ].filter(ma => ma.value !== null).sort((a, b) => b.value - a.value);

        if (mas.length >= 3) {
            const isMultiArrangement = mas[0].name === 'MA5' && mas[1].name === 'MA10' && mas[2].name === 'MA20';
            const isBearArrangement = mas[0].name === 'MA60' && mas[1].name === 'MA20' && mas[2].name === 'MA10';
            
            if (isMultiArrangement) {
                result += "\n🚀 排列：多頭排列 (短期均線在上)，趨勢強勁向上。";
            } else if (isBearArrangement) {
                result += "\n📉 排列：空頭排列 (長期均線在上)，趨勢明確向下。";
            } else {
                result += "\n🔄 排列：均線糾結，趨勢不明確。";
            }
        }
    }

    // --- 成交量分析 ---
    if (lastData.vma5 !== null && lastData.vma20 !== null) {
        result += "\n\n📊 成交量分析";
        result += `\n今日成交量：${(lastData.volume / 1000).toFixed(0)}K股`;
        result += `\n5日平均量：${(lastData.vma5 / 1000).toFixed(0)}K股`;
        result += `\n20日平均量：${(lastData.vma20 / 1000).toFixed(0)}K股`;

        const volumeRatio5 = FinancialIndicators.divide(lastData.volume, lastData.vma5);
        const volumeRatio20 = FinancialIndicators.divide(lastData.volume, lastData.vma20);

        result += `\n量比 (vs 5日)：${volumeRatio5.toFixed(2)}`;
        result += `\n量比 (vs 20日)：${volumeRatio20.toFixed(2)}`;

        // 成交量分析
        if (volumeRatio5 > 2.0) {
            result += "\n🔥 成交量：爆量 (>2倍)，市場關注度極高。";
        } else if (volumeRatio5 > 1.5) {
            result += "\n📈 成交量：放量 (>1.5倍)，市場活躍。";
        } else if (volumeRatio5 < 0.7) {
            result += "\n📉 成交量：縮量 (<0.7倍)，市場觀望。";
        } else {
            result += "\n⚖️ 成交量：正常範圍。";
        }

        // 量價關係
        if (lastData.priceVolumeRelation) {
            result += `\n💹 量價關係：${lastData.priceVolumeRelation}`;
            
            if (lastData.priceVolumeRelation === "價漲量增") {
                result += " - 健康的上漲格局。";
            } else if (lastData.priceVolumeRelation === "價跌量增") {
                result += " - 可能是恐慌性賣壓。";
            } else if (lastData.priceVolumeRelation === "價漲量縮") {
                result += " - 上漲動能不足，留意回檔。";
            } else if (lastData.priceVolumeRelation === "價跌量縮") {
                result += " - 賣壓減輕，可能止跌。";
            }
        }
    } else {
        result += "\n\n📊 成交量分析";
        result += "\n資料不足，無法計算成交量指標。";
    }

    return result;
}

class FinancialIndicators {
    /**
     * 精確的數學運算輔助函數
     */
    static getDecimalPlaces(num) {
        const str = num.toString();
        if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
            return str.split('.')[1].length;
        } else if (str.indexOf('e-') !== -1) {
            const parts = str.split('e-');
            return parseInt(parts[1], 10) + (parts[0].split('.')[1] || '').length;
        }
        return 0;
    }
    /**
     * 精確加法
     * @param {number} a 
     * @param {number} b 
     * @returns {number}
     */
    static add(a, b) {
        const decimalPlaces = Math.max(FinancialIndicators.getDecimalPlaces(a), FinancialIndicators.getDecimalPlaces(b));
        const multiplier = Math.pow(10, decimalPlaces);
        return Math.round((a * multiplier + b * multiplier)) / multiplier;
    }
    /**
    * 精確減法
    * @param {number} a 
    * @param {number} b 
    * @returns {number}
    */
    static subtract(a, b) {
        const decimalPlaces = Math.max(FinancialIndicators.getDecimalPlaces(a), FinancialIndicators.getDecimalPlaces(b));
        const multiplier = Math.pow(10, decimalPlaces);
        return Math.round((a * multiplier - b * multiplier)) / multiplier;
    }
    /**
    * 精確乘法
    * @param {number} a 
    * @param {number} b 
    * @returns {number}
    */
    static multiply(a, b) {
        if (a === 0 || b === 0) return 0;
        
        // 改進：使用更穩定的精度處理
        const result = a * b;
        
        // 如果結果很接近整數，則返回整數
        if (Math.abs(result - Math.round(result)) < Number.EPSILON) {
            return Math.round(result);
        }
        
        // 限制最大精度避免過度計算
        const decimalPlacesA = FinancialIndicators.getDecimalPlaces(a);
        const decimalPlacesB = FinancialIndicators.getDecimalPlaces(b);
        const maxDecimalPlaces = Math.max(decimalPlacesA, decimalPlacesB);
        const precision = Math.min(maxDecimalPlaces + 2, 10); // 限制最大精度為10位
        
        const factor = Math.pow(10, precision);
        return Math.round(result * factor) / factor;
    }
    /**
     * 精確除法
     * @param {number} a 
     * @param {number} b 
     * @returns {number}
     */
    static divide(a, b) {
        if (b === 0) return 0;
        
        // 改進：使用更穩定的除法計算
        const result = a / b;
        
        // 如果結果很接近整數，則返回整數
        if (Math.abs(result - Math.round(result)) < Number.EPSILON) {
            return Math.round(result);
        }
        
        // 動態決定精度，避免過度四捨五入
        const decimalPlacesA = FinancialIndicators.getDecimalPlaces(a);
        const decimalPlacesB = FinancialIndicators.getDecimalPlaces(b);
        const maxDecimalPlaces = Math.max(decimalPlacesA, decimalPlacesB);
        const precision = Math.min(maxDecimalPlaces + 4, 12); // 除法需要更高精度，限制最大為12位
        
        return FinancialIndicators.round(result, precision);
    }
    /**
     * 精確四捨五入
     * @param {number} num 
     * @param {number} precision 小數位數
     * @returns {number}
     */
    static round(num, precision = 2) {
        const multiplier = Math.pow(10, precision);
        return Math.round(num * multiplier) / multiplier;
    }

    /**
     * 計算移動平均線
     * @param {Array} data 股價數據
     * @param {Array} periods 週期陣列 [5, 10, 20, 60]
     */
    calculateMA(data, periods = [5, 20]) {
        periods.forEach(period => {
            for (let i = period - 1; i < data.length; i++) {
                const slice = data.slice(i - period + 1, i + 1);
                const sum = slice.reduce((sum, item) => FinancialIndicators.add(sum, item.close), 0);
                const avg = FinancialIndicators.divide(sum, period);
                data[i][`ma${period}`] = FinancialIndicators.round(avg, 4);
            }
        });
    }

    /**
     * 計算指數移動平均線 (EMA)
     * @param {Array} data 股價數據
     * @param {number} period 週期
     */
    calculateEMA(data, period = 12) {
        if (data.length === 0) return;
        const multiplier = FinancialIndicators.divide(2, period + 1);
        let ema = data[0].close; // 第一個值用收盤價

        data[0][`ema${period}`] = FinancialIndicators.round(ema, 4);

        for (let i = 1; i < data.length; i++) {
            const term1 = FinancialIndicators.multiply(data[i].close, multiplier);
            const term2 = FinancialIndicators.multiply(ema, FinancialIndicators.subtract(1, multiplier));
            ema = FinancialIndicators.add(term1, term2);
            data[i][`ema${period}`] = FinancialIndicators.round(ema, 4);
        }
    }

    /**
     * rsi
     * @param {Array} data 股價數據
     * @param {number} period 週期 (預設14)
     */
    calculateRSI(data, period = 14) {
        if (data.length < period+1) return;

        // 計算價格變化
        for (let i = 1; i < data.length; i++) {
            data[i].priceChange = FinancialIndicators.subtract(data[i].close, data[i - 1].close);
            data[i].gain = data[i].priceChange > 0 ? data[i].priceChange : 0;
            data[i].loss = data[i].priceChange < 0 ? Math.abs(data[i].priceChange) : 0;
        }

        // 計算初始平均漲跌幅
        let avgGain = 0, avgLoss = 0;
        for (let i = 1; i <= period; i++) {
            avgGain = FinancialIndicators.add(avgGain, data[i].gain);
            avgLoss = FinancialIndicators.add(avgLoss, data[i].loss);
        }
        avgGain = FinancialIndicators.divide(avgGain, period);
        avgLoss = FinancialIndicators.divide(avgLoss, period);

        // 計算第一個 rsi
        if (avgLoss === 0) {
            data[period].rsi = 100;
        } else {
            const rs = FinancialIndicators.divide(avgGain, avgLoss);
            data[period].rsi = FinancialIndicators.round(
                FinancialIndicators.subtract(100, FinancialIndicators.divide(100, FinancialIndicators.add(1, rs))), 
                2
            );
        }

        // 使用 Wilder's smoothing 計算後續 RSI
        for (let i = period + 1; i < data.length; i++) {
            const gainTerm = FinancialIndicators.multiply(avgGain, period - 1);
            avgGain = FinancialIndicators.divide(FinancialIndicators.add(gainTerm, data[i].gain), period);
            
            const lossTerm = FinancialIndicators.multiply(avgLoss, period - 1);
            avgLoss = FinancialIndicators.divide(FinancialIndicators.add(lossTerm, data[i].loss), period);
            
            if (avgLoss === 0) {
                data[i].rsi = 100;
            } else {
                const rs = FinancialIndicators.divide(avgGain, avgLoss);
                data[i].rsi = FinancialIndicators.round(
                    FinancialIndicators.subtract(100, FinancialIndicators.divide(100, FinancialIndicators.add(1, rs))), 
                    2
                );
            }
        }
    }

    /**
     * MACD
     * @param {Array} data 股價數據
     * @param {number} fastPeriod 快線週期 (預設12)
     * @param {number} slowPeriod 慢線週期 (預設26)
     * @param {number} signalPeriod 訊號線週期 (預設9)
     */
    calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        // 檢查是否已經有 EMA 值，避免重複計算
        if (!data[0] || !data[0][`ema${fastPeriod}`]) {
            this.calculateEMA(data, fastPeriod);
        }
        if (!data[0] || !data[0][`ema${slowPeriod}`]) {
            this.calculateEMA(data, slowPeriod);
        }

        // 計算 DIF (MACD Line)
        for (let i = slowPeriod - 1; i < data.length; i++) {
            data[i].dif = FinancialIndicators.round(
                FinancialIndicators.subtract(data[i][`ema${fastPeriod}`], data[i][`ema${slowPeriod}`]), 
                4
            );
        }

        // 計算 MACD (Signal Line) - DIF 的 EMA
        const difData = data.slice(slowPeriod - 1).map(item => ({ close: item.dif }));
        this.calculateEMA(difData, signalPeriod);

        // 將 MACD 值複製回原數據
        for (let i = 0; i < difData.length; i++) {
            const originalIndex = i + slowPeriod - 1;
            data[originalIndex].macd = FinancialIndicators.round(difData[i][`ema${signalPeriod}`], 4);
            data[originalIndex].osc = FinancialIndicators.round(
                FinancialIndicators.subtract(data[originalIndex].dif, data[originalIndex].macd), 
                4
            );
        }
    }

    /**
     * 計算布林通道 (Bollinger Bands)
     * @param {Array} data 股價數據
     * @param {number} period 週期 (預設20)
     * @param {number} stdDev 標準差倍數 (預設2)
     */
    calculateBollingerBands(data, period = 20, stdDev = 2) {
        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const prices = slice.map(item => item.close);

            // 計算中線 (MA20)
            const sum = prices.reduce((sum, price) => FinancialIndicators.add(sum, price), 0);
            const middle = FinancialIndicators.divide(sum, period);

            // 計算標準差
            const varianceSum = prices.reduce((sum, price) => {
                const diff = FinancialIndicators.subtract(price, middle);
                return FinancialIndicators.add(sum, FinancialIndicators.multiply(diff, diff));
            }, 0);
            const variance = FinancialIndicators.divide(varianceSum, period);
            const standardDeviation = Math.sqrt(variance);

            data[i].bbMiddle = FinancialIndicators.round(middle, 4);
            data[i].bbUpper = FinancialIndicators.round(
                FinancialIndicators.add(middle, FinancialIndicators.multiply(standardDeviation, stdDev)), 
                4
            );
            data[i].bbLower = FinancialIndicators.round(
                FinancialIndicators.subtract(middle, FinancialIndicators.multiply(standardDeviation, stdDev)), 
                4
            );
            data[i].bbWidth = FinancialIndicators.round(
                FinancialIndicators.subtract(data[i].bbUpper, data[i].bbLower), 
                4
            );
            // 修正：避免除零錯誤
            if (data[i].bbWidth > 0) {
                data[i].bbPosition = FinancialIndicators.round(
                    FinancialIndicators.divide(
                        FinancialIndicators.subtract(data[i].close, data[i].bbLower), 
                        data[i].bbWidth
                    ), 
                    4
                );
            } else {
                data[i].bbPosition = 0.5; // 如果通道寬度為 0，設為中間位置
            }
        }
    }

    /**
     * KD 指標 (台股常用)
     * @param {Array} data 股價數據
     * @param {number} period K值週期 (預設9)
     * @param {number} kSmooth K值平滑 (預設3)
     * @param {number} dSmooth D值平滑 (預設3)
     */
    calculateKD(data, period = 9, kSmooth = 3, dSmooth = 3) {
        // 計算 RSV (Raw Stochastic Value)
        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const highest = Math.max(...slice.map(item => item.high));
            const lowest = Math.min(...slice.map(item => item.low));

            if (highest === lowest) {
                data[i].rsv = 50; // 避免除以零
            } else {
                const numerator = FinancialIndicators.subtract(data[i].close, lowest);
                const denominator = FinancialIndicators.subtract(highest, lowest);
                data[i].rsv = FinancialIndicators.round(
                    FinancialIndicators.multiply(FinancialIndicators.divide(numerator, denominator), 100), 
                    2
                );
            }
        }

        // 計算 K 值 (RSV 的移動平均) - 修正初始值問題
        let kValue = data[period - 1] ? data[period - 1].rsv : 50;
        for (let i = period - 1; i < data.length; i++) {
            if (i === period - 1) {
                // 第一個 K 值等於第一個 RSV
                data[i].k = FinancialIndicators.round(data[i].rsv, 2);
                kValue = data[i].k;
            } else {
                // 後續使用平滑公式：K = (2/3) * 前一日K值 + (1/3) * 今日RSV
                const smoothFactor = FinancialIndicators.divide(1, kSmooth);
                const term1 = FinancialIndicators.multiply(data[i].rsv, smoothFactor);
                const term2 = FinancialIndicators.multiply(kValue, FinancialIndicators.subtract(1, smoothFactor));
                kValue = FinancialIndicators.add(term1, term2);
                data[i].k = FinancialIndicators.round(kValue, 2);
            }
        }

        // 計算 D 值 (K 值的移動平均) - 修正初始值問題
        let dValue = data[period - 1] ? data[period - 1].k : 50;
        for (let i = period - 1; i < data.length; i++) {
            if (i === period - 1) {
                // 第一個 D 值等於第一個 K 值
                data[i].d = FinancialIndicators.round(data[i].k, 2);
                dValue = data[i].d;
            } else {
                // 後續使用平滑公式：D = (2/3) * 前一日D值 + (1/3) * 今日K值
                const smoothFactor = FinancialIndicators.divide(1, dSmooth);
                const term1 = FinancialIndicators.multiply(data[i].k, smoothFactor);
                const term2 = FinancialIndicators.multiply(dValue, FinancialIndicators.subtract(1, smoothFactor));
                dValue = FinancialIndicators.add(term1, term2);
                data[i].d = FinancialIndicators.round(dValue, 2);
            }
        }
    }

    /**
     * 計算成交量指標
     * @param {Array} data 股價數據
     */
    calculateVolumeIndicators(data) {
        // 成交量移動平均
        this.calculateVolumeMA(data, [5, 20]);

        // 量價關係
        for (let i = 1; i < data.length; i++) {
            const priceChange = FinancialIndicators.subtract(data[i].close, data[i - 1].close);
            const volumeChange = FinancialIndicators.subtract(data[i].volume, data[i - 1].volume);

            data[i].priceVolumeRelation = this.analyzePriceVolumeRelation(priceChange, volumeChange);
        }
    }

    /**
     * 計算成交量移動平均
     */
    calculateVolumeMA(data, periods = [5, 20]) {
        periods.forEach(period => {
            for (let i = period - 1; i < data.length; i++) {
                const slice = data.slice(i - period + 1, i + 1);
                const sum = slice.reduce((sum, item) => FinancialIndicators.add(sum, item.volume), 0);
                const avgVolume = FinancialIndicators.divide(sum, period);
                data[i][`vma${period}`] = FinancialIndicators.round(avgVolume, 0);
            }
        });
    }

    /**
     * 分析量價關係
     */
    analyzePriceVolumeRelation(priceChange, volumeChange) {
        if (priceChange > 0 && volumeChange > 0) return "價漲量增";
        if (priceChange > 0 && volumeChange < 0) return "價漲量縮";
        if (priceChange < 0 && volumeChange > 0) return "價跌量增";
        if (priceChange < 0 && volumeChange < 0) return "價跌量縮";
        return "盤整";
    }

    /**
     * 綜合技術分析
     * @param {Array} data 完整的股價數據
     * @returns {Object} 綜合分析結果
     */
    comprehensiveAnalysis(data) {
        if (!data || data.length === 0) return null;

        const latest = data[data.length - 1];
        const previous = data.length > 1 ? data[data.length - 2] : null;

        return {
            trend: this.analyzeTrend(latest, previous),
            momentum: this.analyzeMomentum(latest),
            volatility: this.analyzeVolatility(data.slice(-20)), // 最近20天
            volume: this.analyzeVolume(latest, previous),
            signals: this.generateSignals(latest, previous),
            riskLevel: this.assessRisk(latest, data.slice(-20)),
            score: this.calculateOverallScore(latest, previous)
        };
    }

    /**
     * 趨勢分析
     */
    analyzeTrend(latest, previous) {
        const trends = [];

        if (latest.ma5 && latest.ma20) {
            if (latest.ma5 > latest.ma20) {
                trends.push("短期趨勢向上");
            } else {
                trends.push("短期趨勢向下");
            }
        }

        if (latest.bbPosition !== undefined) {
            if (latest.bbPosition > 0.8) {
                trends.push("接近上軌，注意阻力");
            } else if (latest.bbPosition < 0.2) {
                trends.push("接近下軌，注意支撐");
            }
        }

        return trends;
    }

    /**
     * 動能分析
     */
    analyzeMomentum(latest) {
        const momentum = [];

        if (latest.rsi !== undefined) {
            if (latest.rsi > 70) momentum.push("RSI超買");
            else if (latest.rsi < 30) momentum.push("RSI超賣");
            else momentum.push("RSI中性");
        }

        if (latest.k !== undefined && latest.d !== undefined) {
            if (latest.k > 80) momentum.push("KD超買");
            else if (latest.k < 20) momentum.push("KD超賣");
            else momentum.push("KD中性");
        }

        return momentum;
    }

    /**
     * 波動性分析
     */
    analyzeVolatility(recentData) {
        if (recentData.length < 10) return "數據不足";

        const returns = [];
        for (let i = 1; i < recentData.length; i++) {
            const priceChange = FinancialIndicators.subtract(recentData[i].close, recentData[i - 1].close);
            const dailyReturn = FinancialIndicators.divide(priceChange, recentData[i - 1].close);
            returns.push(dailyReturn);
        }

        const sum = returns.reduce((sum, ret) => FinancialIndicators.add(sum, ret), 0);
        const avgReturn = FinancialIndicators.divide(sum, returns.length);
        
        const varianceSum = returns.reduce((sum, ret) => {
            const diff = FinancialIndicators.subtract(ret, avgReturn);
            return FinancialIndicators.add(sum, FinancialIndicators.multiply(diff, diff));
        }, 0);
        const variance = FinancialIndicators.divide(varianceSum, returns.length);
        const volatility = FinancialIndicators.multiply(Math.sqrt(variance), Math.sqrt(252)); // 年化波動率

        if (volatility > 0.3) return "高波動";
        if (volatility > 0.2) return "中波動";
        return "低波動";
    }

    /**
     * 成交量分析
     */
    analyzeVolume(latest, previous) {
        if (!previous || !latest.vma5) return "數據不足";

        const volumeRatio = FinancialIndicators.divide(latest.volume, latest.vma5);
        const priceChange = FinancialIndicators.subtract(latest.close, previous.close);

        if (volumeRatio > 1.5) {
            return priceChange > 0 ? "放量上漲" : "放量下跌";
        } else if (volumeRatio < 0.7) {
            return priceChange > 0 ? "縮量上漲" : "縮量下跌";
        }
        return "量能正常";
    }

    /**
     * 生成交易信號
     */
    generateSignals(latest, previous) {
        const signals = [];

        // MA 交叉信號
        if (previous && latest.ma5 && latest.ma20 && previous.ma5 && previous.ma20) {
            if (previous.ma5 <= previous.ma20 && latest.ma5 > latest.ma20) {
                signals.push({ type: "買進", reason: "MA黃金交叉", strength: "強" });
            } else if (previous.ma5 >= previous.ma20 && latest.ma5 < latest.ma20) {
                signals.push({ type: "賣出", reason: "MA死亡交叉", strength: "強" });
            }
        }

        // MACD 信號
        if (previous && latest.dif && latest.macd && previous.dif && previous.macd) {
            if (previous.dif <= previous.macd && latest.dif > latest.macd) {
                signals.push({ type: "買進", reason: "MACD黃金交叉", strength: "中" });
            } else if (previous.dif >= previous.macd && latest.dif < latest.macd) {
                signals.push({ type: "賣出", reason: "MACD死亡交叉", strength: "中" });
            }
        }

        // RSI 極值信號
        if (latest.rsi) {
            if (latest.rsi < 30) {
                signals.push({ type: "買進", reason: "RSI超賣反彈", strength: "中" });
            } else if (latest.rsi > 70) {
                signals.push({ type: "賣出", reason: "RSI超買回檔", strength: "中" });
            }
        }

        return signals;
    }

    /**
     * 風險評估
     */
    assessRisk(latest, recentData) {
        let riskScore = 0;

        // RSI 風險
        if (latest.rsi > 80) riskScore += 2;
        else if (latest.rsi > 70) riskScore += 1;
        else if (latest.rsi < 20) riskScore += 2;
        else if (latest.rsi < 30) riskScore += 1;

        // 波動性風險
        const volatility = this.analyzeVolatility(recentData);
        if (volatility === "高波動") riskScore += 2;
        else if (volatility === "中波動") riskScore += 1;

        // 布林通道風險
        if (latest.bbPosition > 0.9 || latest.bbPosition < 0.1) riskScore += 1;

        if (riskScore >= 4) return "高風險";
        if (riskScore >= 2) return "中風險";
        return "低風險";
    }

    /**
     * 計算綜合評分 (1-10分)
     */
    calculateOverallScore(latest, previous) {
        let score = 5; // 基準分數

        // MA 趨勢加分
        if (latest.ma5 && latest.ma20) {
            if (latest.ma5 > latest.ma20) score += 1;
            else score -= 1;
        }

        // RSI 加分
        if (latest.rsi) {
            if (latest.rsi > 30 && latest.rsi < 70) score += 1;
            else if (latest.rsi < 30) score += 2; // 超賣反彈機會
            else if (latest.rsi > 70) score -= 1; // 超買風險
        }

        // MACD 加分
        if (latest.dif && latest.macd) {
            if (latest.dif > latest.macd) score += 1;
            else score -= 1;
        }

        // 成交量加分
        if (latest.volume && latest.vma5) {
            const volumeRatio = FinancialIndicators.divide(latest.volume, latest.vma5);
            if (volumeRatio > 1.2) score += 0.5; // 放量
        }

        return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
    }
}