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
        suggestion: ''
    };

    for (let i = 0; i < 3; i++) {
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

    // 計算技術指標
    calculateMA(result.stockDatas);
    calculateRSI(result.stockDatas, 14);
    calculateMACD(result.stockDatas);

    result.suggestion = analyzeResult(result.stockDatas);
    return result;
}

async function getClosePrices(stockNo, yyyymmdd) {
    const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${yyyymmdd}&stockNo=${stockNo}`;
    const res = await fetch(url);
    const data = await res.json();

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
        });
    }
    return result;
}

function convertDate(rocDateStr) {
    const parts = rocDateStr.split('/');
    const year = parseInt(parts[0], 10) + 1911;
    return `${year}/${parts[1]}/${parts[2]}`;
}

function calculateMA(data) {
    for (let i = 4; i < data.length; i++) {
        const last5 = data.slice(i - 4, i + 1);
        data[i].MA5 = average(last5.map(d => d.close));

        if (i >= 19) {
            const last20 = data.slice(i - 19, i + 1);
            data[i].MA20 = average(last20.map(d => d.close));
        }
    }
}

function average(arr) {
    const sum = arr.reduce((a, b) => a + b, 0);
    return arr.length > 0 ? sum / arr.length : null;
}

function calculateRSI(data, period) {
    if (data.length <= period) return;

    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    if (avgLoss > 0) {
        const rs = avgGain / avgLoss;
        data[period].RSI = 100 - (100 / (1 + rs));
    } else {
        data[period].RSI = 100;
    }

    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        data[i].RSI = avgLoss > 0 ? 100 - (100 / (1 + avgGain / avgLoss)) : 100;
    }
}

function calculateMACD(data) {
    const shortPeriod = 12;
    const longPeriod = 26;
    const signalPeriod = 9;

    let prevEMA12 = null;
    let prevEMA26 = null;
    let prevMACD = null;

    for (const d of data) {
        const close = d.close;

        d.EMA12 = prevEMA12 === null ? close : prevEMA12 + (close - prevEMA12) * (2 / (shortPeriod + 1));
        d.EMA26 = prevEMA26 === null ? close : prevEMA26 + (close - prevEMA26) * (2 / (longPeriod + 1));
        d.DIF = d.EMA12 - d.EMA26;

        d.MACD = prevMACD === null ? d.DIF : prevMACD + (d.DIF - prevMACD) * (2 / (signalPeriod + 1));
        d.OSC = d.DIF - d.MACD;

        prevEMA12 = d.EMA12;
        prevEMA26 = d.EMA26;
        prevMACD = d.MACD;
    }
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
        const ma5 = lastData.MA5;
        const ma20 = lastData.MA20;
        const prev_ma5 = data[data.length - 2].MA5; // 獲取倒數第二筆數據的 MA5
        const prev_ma20 = data[data.length - 2].MA20; // 獲取倒數第二筆數據的 MA20

        if (ma5 !== null && ma20 !== null && prev_ma5 !== null && prev_ma20 !== null) {
            result += `\n📊 均線指標`;
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


    // --- RSI 分析 ---
    const rsi = lastData.RSI;
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

    // --- MACD 分析 ---
    // 檢查最新一筆數據是否有 MACD 相關值
    if (lastData.DIF !== null && lastData.MACD !== null) {

        const dif = lastData.DIF;
        const macd = lastData.MACD;
        const osc = (lastData.OSC !== null && lastData.OSC !== undefined) ? lastData.OSC : 0;

        result += "\n\n📊 MACD 指標 (12, 26, 9)";
        result += `\nDIF (MACD 線)：${dif.toFixed(2)}`;
        result += `\nMACD (訊號線)：${macd.toFixed(2)}`;
        result += `\nOSC (柱狀圖)：${osc.toFixed(2)}`;

        // 判斷 MACD 交叉訊號需要至少兩筆數據
        if (data.length >= 2) {
            const secondLastData = data[data.length - 2];
            if (secondLastData.DIF !== null && secondLastData.MACD !== null) {

                const prevDif = secondLastData.DIF;
                const prevMacdSignal = secondLastData.MACD;

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

    return result;
}