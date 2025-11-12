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
        const processedData = formatDataForFrontend(result, data.id);

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: processedData,
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

    // 並行抓取近 5 個月的月資料以獲得更準確的技術指標
    const dateStrs = [];
    for (let i = 0; i < 5; i++) {
        let year = today.getFullYear();
        let month = today.getMonth() + 1 - i;
        if (month <= 0) {
            year--;
            month += 12;
        }
        dateStrs.push(`${year}${month.toString().padStart(2, '0')}01`);
    }

    const monthDatas = await Promise.all(dateStrs.map(dateStr => getClosePrices(stockId, dateStr)));
    monthDatas.forEach(prices => result.stockDatas.push(...prices));

    // 過濾非法資料並按日期排序（使用 YYYY-MM-DD 以提升解析穩定性）
    result.stockDatas = result.stockDatas
        .filter(p => p && p.close > 0 && p.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 技術指標計算
    const financialIndicators = new FinancialIndicators();
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
    result.suggestion = analyzeResult(result.stockDatas);
    
    return result;
}

async function getClosePrices(stockNo, yyyymmdd) {
    const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${yyyymmdd}&stockNo=${stockNo}`;
    const res = await fetch(url);
    const data = await res.json();

    // 基本防呆：檢查回傳狀態與資料結構
    if (!data || data.stat !== 'OK' || !Array.isArray(data.data)) {
        return [];
    }

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
            volume: parseInt(row[1].replace(/,/g, '')) || 0,
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
    if (!rocDateStr || typeof rocDateStr !== 'string') return null;
    const parts = rocDateStr.split('/');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    if (isNaN(year)) return null;
    const yyyy = year + 1911;
    const mm = parts[1];
    const dd = parts[2];
    return `${yyyy}-${mm}-${dd}`; // 使用 YYYY-MM-DD 以提升 new Date 解析穩定性
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

        if (ma5 != null && ma20 != null && prev_ma5 != null && prev_ma20 != null) {
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
        result += "\n📉 資料不足，無法判斷 MA 交叉（至少需兩天資料）。";
    }


    // --- rsi 分析 ---
    const rsi = lastData.rsi;
    if (rsi != null) {
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
    if (lastData.dif != null && lastData.macd != null) {

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
            if (secondLastData.dif != null && secondLastData.macd != null) {

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
    if (lastData.bbMiddle != null && lastData.bbUpper != null && lastData.bbLower != null) {
        result += "\n\n📈 布林通道指標 (20日, 2倍標準差)";
        result += `\n上軌：${lastData.bbUpper.toFixed(2)}`;
        result += `\n中軌：${lastData.bbMiddle.toFixed(2)}`;
        result += `\n下軌：${lastData.bbLower.toFixed(2)}`;
        result += `\n目前價位：${lastData.close.toFixed(2)}`;
        result += `\n通道位置：${FinancialIndicators.multiply(lastData.bbPosition, 100).toFixed(1)}%`;

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
        const bbWidthRatio = FinancialIndicators.divide(lastData.bbWidth, lastData.bbMiddle);
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
    if (lastData.k != null && lastData.d != null) {
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
    if (lastData.ema12 != null && lastData.ema26 != null) {
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
    if (lastData.ma10 != null && lastData.ma60 != null) {
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
        ].filter(ma => ma.value != null && Number.isFinite(ma.value)).sort((a, b) => b.value - a.value);

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

        // 中期均線交叉 (20 vs 60)
        if (data.length >= 2) {
            const prev = data[data.length - 2];
            const m20 = lastData.ma20;
            const m60 = lastData.ma60;
            const prev20 = prev.ma20;
            const prev60 = prev.ma60;
            if (m20 != null && m60 != null && prev20 != null && prev60 != null) {
                if (prev20 <= prev60 && m20 > m60) {
                    result += "\n✨ 訊號：20MA 向上突破 60MA（中期黃金交叉）。";
                } else if (prev20 >= prev60 && m20 < m60) {
                    result += "\n💀 訊號：20MA 向下跌破 60MA（中期死亡交叉）。";
                } else if (m20 > m60) {
                    result += "\n🟢 趨勢：20MA 在 60MA 之上，中期偏多。";
                } else if (m20 < m60) {
                    result += "\n🔴 趨勢：20MA 在 60MA 之下，中期偏空。";
                }
            }
        }
    }

    // --- 成交量分析 ---
    if (lastData.vma5 != null && lastData.vma20 != null) {
        result += "\n\n📊 成交量分析";
        result += `\n今日成交量：${FinancialIndicators.divide(lastData.volume, 1000).toFixed(0)}K股`;
        result += `\n5日平均量：${FinancialIndicators.divide(lastData.vma5, 1000).toFixed(0)}K股`;
        result += `\n20日平均量：${FinancialIndicators.divide(lastData.vma20, 1000).toFixed(0)}K股`;

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

        // 整數化算法：將 a、b 各自去小數點後轉為整數再計算，降低浮點誤差
        const decA = FinancialIndicators.getDecimalPlaces(a);
        const decB = FinancialIndicators.getDecimalPlaces(b);

        // 將數字按其小數位數轉為整數字串，再轉回數字，避免直接乘 10^n 的浮點誤差
        const intA = parseInt(a.toFixed(decA).replace('.', ''), 10);
        const intB = parseInt(b.toFixed(decB).replace('.', ''), 10);

        // 計算乘積後再縮放回來
        const scaledProduct = intA * intB;
        const result = scaledProduct / Math.pow(10, decA + decB);

        // 如果結果非常接近整數，直接回傳整數（維持原本行為）
        if (Math.abs(result - Math.round(result)) < Number.EPSILON) {
            return Math.round(result);
        }

        // 與原行為一致：動態決定四捨五入精度，使用 max(decA, decB) + 2，並限制上限
        const maxDecimalPlaces = Math.max(decA, decB);
        const precision = Math.min(maxDecimalPlaces + 2, 10);
        return FinancialIndicators.round(result, precision);
    }
    /**
     * 精確除法
     * @param {number} a 
     * @param {number} b 
     * @returns {number}
     */
    static divide(a, b) {
        if (b === 0) return 0;

        // 整數化 + 尺度算法：將 a、b 去小數後相除，並用 10^(decB - decA) 調整尺度
        const decA = FinancialIndicators.getDecimalPlaces(a);
        const decB = FinancialIndicators.getDecimalPlaces(b);

        const intA = parseInt(a.toFixed(decA).replace('.', ''), 10);
        const intB = parseInt(b.toFixed(decB).replace('.', ''), 10);
        if (intB === 0) return 0; // 再次防呆

        // (intA / intB) * 10^(decB - decA)
        const raw = intA / intB;
        const result = raw * Math.pow(10, decB - decA);

        // 如果結果非常接近整數，直接回傳整數（維持原本行為）
        if (Math.abs(result - Math.round(result)) < Number.EPSILON) {
            return Math.round(result);
        }

        // 與原行為一致：動態決定四捨五入精度，使用 max(decA, decB) + 4，並限制上限
        const maxDecimalPlaces = Math.max(decA, decB);
        const precision = Math.min(maxDecimalPlaces + 4, 12);
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
            momentum: this.analyzeMomentum(latest, previous, data.slice(-5)),
            volatility: this.analyzeVolatility(data.slice(-20)), // 最近20天
            volume: this.analyzeVolume(latest, previous),
            signals: this.generateSignals(latest, previous, data.slice(-5)), 
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

        if (latest.bbPosition != null) {
            if (latest.bbPosition > 0.8) {
                trends.push("接近上軌，注意阻力");
            } else if (latest.bbPosition < 0.2) {
                trends.push("接近下軌，注意支撐");
            }
        }

        // MA60/季線 與中期趨勢
        if (latest.ma20 != null && latest.ma60 != null) {
            if (latest.ma20 > latest.ma60) trends.push("中期趨勢向上");
            else trends.push("中期趨勢向下");
        }
        if (latest.ma60 != null && latest.close != null) {
            if (latest.close > latest.ma60) trends.push("價格站上季線");
            else trends.push("價格跌破季線");
        }

        return trends;
    }

    /**
     * 動能分析
     */
    analyzeMomentum(latest, previous = null, recent = []) {
        const momentum = [];

        // 1) RSI：用白話解釋力度與含義
        if (latest.rsi != null) {
            const rsi = latest.rsi;
            const prevRsi = previous && previous.rsi != null ? previous.rsi : null;
            const delta = prevRsi != null ? rsi - prevRsi : null;

            const zone = rsi >= 70 ? "超買（偏熱）" : rsi <= 30 ? "超賣（偏冷）" : rsi >= 50 ? "偏多" : "偏空";
            const trend = delta != null ? (delta > 0.5 ? `較昨日上升 ${delta.toFixed(2)}` : (delta < -0.5 ? `較昨日下降 ${Math.abs(delta).toFixed(2)}` : "與昨日變化不大")) : null;
            const cross50 = prevRsi != null ? (prevRsi <= 50 && rsi > 50 ? "今天站上 50" : (prevRsi >= 50 && rsi < 50 ? "今天跌破 50" : null)) : null;

            const meaning = rsi > 70
                ? "買方力量明顯較強，短線續漲機會較高，但也更容易出現震盪或回檔。"
                : rsi < 30
                ? "賣方力量偏強，但下跌動能可能接近尾聲，短線較容易出現技術性反彈。"
                : rsi >= 50
                ? "買方力量略占優勢，偏多但強度普通。"
                : "賣方力量略占優勢，偏空但強度普通。";

            const pieces = [
                `RSI 現為 ${rsi.toFixed(2)}（${zone}）`,
                trend,
                cross50,
                meaning
            ].filter(Boolean);
            momentum.push(pieces.join("；"));
        }

        // 2) MACD/OSC：用白話解釋動能方向與變化
        if (latest.osc != null && latest.dif != null && latest.macd != null) {
            const osc = latest.osc;
            const prevOsc = previous && previous.osc != null ? previous.osc : null;
            const delta = prevOsc != null ? (osc - prevOsc) : null;
            const dir = osc > 0 ? "正值（多方動能）" : osc < 0 ? "負值（空方動能）" : "接近零軸（動能中性）";
            const change = delta != null ? (delta > 0 ? `較昨日擴大 ${delta.toFixed(2)}` : (delta < 0 ? `較昨日縮小 ${Math.abs(delta).toFixed(2)}` : "與昨日變化不大")) : null;
            const arrange = latest.dif > latest.macd ? "多頭排列（DIF 在訊號線上方）" : latest.dif < latest.macd ? "空頭排列（DIF 在訊號線下方）" : "DIF 與訊號線接近";

            const meaning = osc > 0
                ? (delta != null && delta > 0 ? "上漲動能正在增加，趨勢偏多。" : "上漲動能存在但未明顯增加。")
                : osc < 0
                ? (delta != null && delta < 0 ? "下跌動能正在增加，趨勢偏空。" : "下跌動能存在但未明顯增加。")
                : "動能不足，價格可能偏向盤整。";

            const pieces = [
                `MACD 柱狀圖為 ${dir}（OSC ${osc.toFixed(2)}）`,
                change,
                arrange,
                meaning
            ].filter(Boolean);
            momentum.push(pieces.join("；"));
        }

        // 3) KD：用白話解釋區域、交叉與方向
        if (latest.k != null && latest.d != null) {
            const k = latest.k, d = latest.d;
            const prevK = previous && previous.k != null ? previous.k : null;
            const prevD = previous && previous.d != null ? previous.d : null;
            const deltaK = prevK != null ? (k - prevK) : null;

            const zone = (k > 80 && d > 80) ? "超買（偏熱）" : (k < 20 && d < 20) ? "超賣（偏冷）" : "中性區";
            const cross = (prevK != null && prevD != null)
                ? (prevK <= prevD && k > d ? "出現黃金交叉（短線轉強訊號）" : (prevK >= prevD && k < d ? "出現死亡交叉（短線轉弱訊號）" : null))
                : null;
            const kTrend = deltaK != null ? (deltaK > 1 ? `K 值較昨日上升 ${deltaK.toFixed(2)}` : (deltaK < -1 ? `K 值較昨日下降 ${Math.abs(deltaK).toFixed(2)}` : "K 值與昨日變化不大")) : null;

            const meaning = (k > d)
                ? "K 線在 D 線之上，通常代表短線動能偏多。"
                : (k < d)
                ? "K 線在 D 線之下，通常代表短線動能偏空。"
                : "K 與 D 接近，短線方向不明。";

            const pieces = [
                `KD 現為 K ${k.toFixed(2)}、D ${d.toFixed(2)}（${zone}）`,
                cross,
                kTrend,
                meaning
            ].filter(Boolean);
            momentum.push(pieces.join("；"));
        }

        // 4) 短期 ROC（3日）：用百分比說明
        if (recent && recent.length >= 4) {
            const base = recent[recent.length - 4].close;
            if (base > 0 && latest.close != null) {
                const roc3 = FinancialIndicators.multiply(
                    FinancialIndicators.divide(
                        FinancialIndicators.subtract(latest.close, base),
                        base
                    ),
                    100
                );
                const tag = roc3 > 2 ? "偏強" : roc3 < -2 ? "偏弱" : "中性";
                const meaning = roc3 > 2
                    ? "短線漲幅較明顯，買方動能佔優。"
                    : roc3 < -2
                    ? "短線跌幅較明顯，賣方動能佔優。"
                    : "短線變動有限，價格多在區間震盪。";
                momentum.push(`近 3 日變動為 ${roc3.toFixed(2)}%（${tag}）；${meaning}`);
            }
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
    generateSignals(latest, previous, recent = []) {
        const signals = [];

        // MA 交叉信號（去雜訊：要求交叉後仍維持，且跨越幅度至少 0.1%）
        if (previous && latest.ma5 && latest.ma20 && previous.ma5 && previous.ma20) {
            const crossedUp = previous.ma5 <= previous.ma20 && latest.ma5 > latest.ma20;
            const crossedDown = previous.ma5 >= previous.ma20 && latest.ma5 < latest.ma20;
            const crossStrength = FinancialIndicators.divide(
                Math.abs(FinancialIndicators.subtract(latest.ma5, latest.ma20)),
                latest.ma20
            );

            const sustainedUp = crossedUp && recent.length >= 2
                ? recent.slice(-2).every(x => x.ma5 && x.ma20 ? x.ma5 >= x.ma20 : true)
                : crossedUp;
            const sustainedDown = crossedDown && recent.length >= 2
                ? recent.slice(-2).every(x => x.ma5 && x.ma20 ? x.ma5 <= x.ma20 : true)
                : crossedDown;

            if (sustainedUp && crossStrength >= 0.001) {
                signals.push({ type: "買進", reason: "MA黃金交叉（維持）", strength: crossStrength > 0.005 ? "強" : "中" });
            } else if (sustainedDown && crossStrength >= 0.001) {
                signals.push({ type: "賣出", reason: "MA死亡交叉（維持）", strength: crossStrength > 0.005 ? "強" : "中" });
            }
        }

        // MACD 信號（去雜訊：交叉後連續維持，且 OSC 同向配合）
        if (previous && latest.dif != null && latest.macd != null && previous.dif != null && previous.macd != null) {
            const crossedUp = previous.dif <= previous.macd && latest.dif > latest.macd;
            const crossedDown = previous.dif >= previous.macd && latest.dif < latest.macd;

            const sustainedUp = crossedUp && recent.length >= 2
                ? recent.slice(-2).every(x => (x.dif != null && x.macd != null) ? x.dif >= x.macd : true)
                : crossedUp;
            const sustainedDown = crossedDown && recent.length >= 2
                ? recent.slice(-2).every(x => (x.dif != null && x.macd != null) ? x.dif <= x.macd : true)
                : crossedDown;

            if (sustainedUp && latest.osc > 0) {
                signals.push({ type: "買進", reason: "MACD黃金交叉（維持且動能正）", strength: "中" });
            } else if (sustainedDown && latest.osc < 0) {
                signals.push({ type: "賣出", reason: "MACD死亡交叉（維持且動能負）", strength: "中" });
            }
        }

        // RSI 極值信號
        if (latest.rsi != null) {
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
        if (latest.ma5 != null && latest.ma20 != null) {
            if (latest.ma5 > latest.ma20) score += 1;
            else score -= 1;
        }

        // RSI 加分
        if (latest.rsi != null) {
            if (latest.rsi > 30 && latest.rsi < 70) score += 1;
            else if (latest.rsi < 30) score += 2; // 超賣反彈機會
            else if (latest.rsi > 70) score -= 1; // 超買風險
        }

        // MACD 加分
        if (latest.dif != null && latest.macd != null) {
            if (latest.dif > latest.macd) score += 1;
            else score -= 1;
        }

        // 成交量加分
        if (latest.volume != null && latest.vma5 != null) {
            const volumeRatio = FinancialIndicators.divide(latest.volume, latest.vma5);
            if (volumeRatio > 1.2) score += 0.5; // 放量
        }

        return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
    }
}

/**
 * 將原始分析數據格式化為前端可直接使用的格式
 * @param {Object} rawData 原始分析數據
 * @param {string} stockId 股票代號
 * @returns {Object} 格式化後的數據
 */
function formatDataForFrontend(rawData, stockId) {
    if (!rawData.stockDatas || rawData.stockDatas.length === 0) {
        return null;
    }

    const latestData = rawData.stockDatas[rawData.stockDatas.length - 1];
    const previousData = rawData.stockDatas.length > 1 ? rawData.stockDatas[rawData.stockDatas.length - 2] : null;

    return {
        // 股票基本資訊 (已格式化)
        stockInfo: formatStockInfo(latestData, previousData, stockId),
        
        // 技術指標 (已判斷狀態)
        indicators: formatIndicators(latestData),
        
        // 詳細技術指標 (已格式化)
        detailedIndicators: formatDetailedIndicators(latestData),
        
        // 綜合分析 (已處理完成)
        analysis: formatAnalysis(rawData.comprehensiveAnalysis, latestData, previousData),
        
        // 完整分析建議 (HTML 格式)
        suggestion: rawData.suggestion
    };
}

/**
 * 格式化股票基本資訊
 */
function formatStockInfo(latestData, previousData, stockId) {
    const priceChange = previousData ? 
        FinancialIndicators.subtract(latestData.close, previousData.close) : 0;
    const changePercent = previousData && previousData.close > 0 ? 
        FinancialIndicators.multiply(FinancialIndicators.divide(priceChange, previousData.close), 100) : 0;
    
    const changeText = priceChange !== 0 ? 
        `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)} (${changePercent.toFixed(2)}%)` : 
        "0.00 (0.00%)";
    
    const changeClass = priceChange > 0 ? "positive" : priceChange < 0 ? "negative" : "neutral";

    return {
        stockId: stockId,
        date: latestData.date,
        close: latestData.close.toFixed(2),
        change: changeText,
        changeClass: changeClass,
        volume: latestData.volume.toLocaleString()
    };
}

/**
 * 格式化技術指標
 */
function formatIndicators(latestData) {
    const indicators = [];

    // RSI
    if (latestData.rsi !== null && latestData.rsi !== undefined) {
        let status = "中性", statusClass = "neutral";
        if (latestData.rsi > 70) {
            status = "超買"; statusClass = "bearish";
        } else if (latestData.rsi < 30) {
            status = "超賣"; statusClass = "bullish";
        }
        
        indicators.push({
            name: "RSI (14)",
            value: latestData.rsi.toFixed(2),
            status: status,
            statusClass: statusClass,
            description: `RSI ${status === "中性" ? "處於正常區間" : status}`
        });
    }

    // MA5
    if (latestData.ma5 !== null && latestData.ma5 !== undefined) {
        const isAbove = latestData.close > latestData.ma5;
        indicators.push({
            name: "MA5",
            value: latestData.ma5.toFixed(2),
            status: isAbove ? "多頭" : "空頭",
            statusClass: isAbove ? "bullish" : "bearish",
            description: `價格${isAbove ? "站上" : "跌破"} 5 日均線`
        });
    }

    // MA20
    if (latestData.ma20 !== null && latestData.ma20 !== undefined) {
        const isAbove = latestData.close > latestData.ma20;
        indicators.push({
            name: "MA20",
            value: latestData.ma20.toFixed(2),
            status: isAbove ? "多頭" : "空頭",
            statusClass: isAbove ? "bullish" : "bearish",
            description: `價格${isAbove ? "站上" : "跌破"} 20 日均線`
        });
    }

    // MACD
    if (latestData.dif !== null && latestData.dif !== undefined) {
        const isPositive = latestData.dif > 0;
        indicators.push({
            name: "MACD",
            value: latestData.dif.toFixed(4),
            status: isPositive ? "多頭" : "空頭",
            statusClass: isPositive ? "bullish" : "bearish",
            description: `DIF 在零軸${isPositive ? "上方" : "下方"}`
        });
    }

    // KD-K
    if (latestData.k !== null && latestData.k !== undefined) {
        let status = "中性", statusClass = "neutral";
        if (latestData.k > 80) {
            status = "超買"; statusClass = "bearish";
        } else if (latestData.k < 20) {
            status = "超賣"; statusClass = "bullish";
        }
        
        indicators.push({
            name: "KD-K",
            value: latestData.k.toFixed(2),
            status: status,
            statusClass: statusClass,
            description: `K 值${status === "中性" ? "處於正常區間" : "進入" + status + "區"}`
        });
    }

    // KD-D
    if (latestData.d !== null && latestData.d !== undefined) {
        let status = "中性", statusClass = "neutral";
        if (latestData.d > 80) {
            status = "超買"; statusClass = "bearish";
        } else if (latestData.d < 20) {
            status = "超賣"; statusClass = "bullish";
        }
        
        indicators.push({
            name: "KD-D",
            value: latestData.d.toFixed(2),
            status: status,
            statusClass: statusClass,
            description: `D 值${status === "中性" ? "處於正常區間" : "進入" + status + "區"}`
        });
    }

    // 成交量比
    if (latestData.volume && latestData.vma5) {
        const volumeRatio = FinancialIndicators.divide(latestData.volume, latestData.vma5);
        let status = "正常", statusClass = "neutral";
        let description = "成交量正常";
        
        if (volumeRatio > 1.5) {
            status = "放量"; statusClass = "bullish";
            description = `成交量較平均值增加 ${((volumeRatio - 1) * 100).toFixed(0)}%`;
        } else if (volumeRatio < 0.7) {
            status = "縮量"; statusClass = "bearish";
            description = `成交量較平均值減少 ${((1 - volumeRatio) * 100).toFixed(0)}%`;
        }
        
        indicators.push({
            name: "成交量比",
            value: volumeRatio.toFixed(2),
            status: status,
            statusClass: statusClass,
            description: description
        });
    }

    // 量價關係
    if (latestData.priceVolumeRelation) {
        let statusClass = "neutral";
        let description = "量價關係正常";
        
        if (latestData.priceVolumeRelation === "價漲量增") {
            statusClass = "bullish";
            description = "健康的上漲格局";
        } else if (latestData.priceVolumeRelation === "價跌量增") {
            statusClass = "bearish";
            description = "可能恐慌性賣壓";
        } else if (latestData.priceVolumeRelation === "價漲量縮") {
            statusClass = "neutral";
            description = "上漲動能不足，留意回檔";
        } else if (latestData.priceVolumeRelation === "價跌量縮") {
            statusClass = "neutral";
            description = "賣壓減輕，可能止跌";
        }
        
        indicators.push({
            name: "量價關係",
            value: latestData.priceVolumeRelation,
            status: latestData.priceVolumeRelation === "價漲量增" ? "健康" : "觀察",
            statusClass: statusClass,
            description: description
        });
    }

    return indicators;
}

/**
 * 格式化詳細技術指標
 */
function formatDetailedIndicators(latestData) {
    return {
        ema12: latestData.ema12 !== null ? latestData.ema12.toFixed(4) : "計算中",
        ema26: latestData.ema26 !== null ? latestData.ema26.toFixed(4) : "計算中",
        macdSignal: latestData.macd !== null ? latestData.macd.toFixed(4) : "計算中",
        macdOsc: latestData.osc !== null ? latestData.osc.toFixed(4) : "計算中",
        rsv: latestData.rsv !== null ? latestData.rsv.toFixed(4) : "計算中",
        vma5: latestData.vma5 !== null ? `${(latestData.vma5 / 1000).toFixed(0)}K股` : "計算中",
        vma20: latestData.vma20 !== null ? `${(latestData.vma20 / 1000).toFixed(0)}K股` : "計算中",
        ma10: latestData.ma10 !== null ? latestData.ma10.toFixed(4) : "計算中"
    };
}

/**
 * 格式化綜合分析
 */
function formatAnalysis(comprehensiveAnalysis, latestData, previousData) {
    if (!comprehensiveAnalysis) {
        return {
            score: 5.0,
            riskLevel: "中風險",
            riskClass: "medium",
            signals: [],
            trends: [],
            momentum: []
        };
    }

    // 格式化交易信號
    const signals = (comprehensiveAnalysis.signals || []).map(signal => ({
        type: signal.type,
        typeClass: signal.type === "買進" ? "buy" : "sell",
        icon: signal.type === "買進" ? "📈" : "📉",
        reason: signal.reason,
        strength: signal.strength,
        strengthClass: signal.strength === "強" ? "strong" : signal.strength === "中" ? "medium" : "weak"
    }));

    // 風險等級類別
    const riskClass = comprehensiveAnalysis.riskLevel === "低風險" ? "low" :
                      comprehensiveAnalysis.riskLevel === "高風險" ? "high" : "medium";

    return {
        score: comprehensiveAnalysis.score || 5.0,
        riskLevel: comprehensiveAnalysis.riskLevel || "中風險",
        riskClass: riskClass,
        signals: signals,
        trends: comprehensiveAnalysis.trend || comprehensiveAnalysis.trends || [],
        momentum: comprehensiveAnalysis.momentum || []
    };
}