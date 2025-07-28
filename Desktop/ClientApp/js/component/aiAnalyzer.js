/**
 * AI 分析器 - 使用 Gemini API 提供股票分析解釋
 */
class AIAnalyzer {
    constructor() {
        // 這裡應該從配置檔讀取，暫時先寫在這裡
        this.apiKey = 'YOUR_GEMINI_API_KEY'; // 需要替換為實際的 API Key
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    /**
     * 分析股票數據並提供 AI 解釋
     * @param {Object} analysisData 分析數據
     * @param {string} stockId 股票代號
     * @returns {Promise<string>} AI 分析結果
     */
    async analyzeStock(analysisData, stockId) {
        try {
            const prompt = this.buildPrompt(analysisData, stockId);
            const response = await this.callGeminiAPI(prompt);
            return this.formatResponse(response);
        } catch (error) {
            console.error('AI 分析失敗:', error);
            return this.getFallbackAnalysis(analysisData);
        }
    }

    /**
     * 建立 AI 提示詞
     */
    buildPrompt(data, stockId) {
        const lastData = data.stockDatas[data.stockDatas.length - 1];
        
        return `你是一位專業且親切的股票分析師，請用淺顯易懂的方式為投資新手分析以下股票：

股票代號: ${stockId}
目前股價: ${lastData.close}元
5日均線: ${lastData.MA5 ? (Math.round(lastData.MA5 * 100) / 100).toFixed(2) : '計算中'}元
20日均線: ${lastData.MA20 ? (Math.round(lastData.MA20 * 100) / 100).toFixed(2) : '計算中'}元
RSI指標: ${lastData.RSI ? (Math.round(lastData.RSI * 100) / 100).toFixed(2) : '計算中'}
MACD DIF: ${lastData.DIF ? (Math.round(lastData.DIF * 10000) / 10000).toFixed(4) : '計算中'}
MACD 訊號線: ${lastData.MACD ? (Math.round(lastData.MACD * 10000) / 10000).toFixed(4) : '計算中'}
MACD 柱狀圖: ${lastData.OSC ? (Math.round(lastData.OSC * 10000) / 10000).toFixed(4) : '計算中'}

請提供以下分析，用詞要親切易懂：

1. 📊 **目前趨勢**: 用簡單的話說明股票現在是上漲、下跌還是盤整
2. 💡 **投資建議**: 現在適合買進、賣出還是觀望？為什麼？
3. ⚠️ **風險提醒**: 有什麼需要注意的風險？
4. 🎯 **操作策略**: 給新手的具體建議，包括停損停利點
5. 📈 **後市看法**: 短期內可能的走勢

請避免使用過於專業的術語，多用比喻和生活化的例子來解釋。回答要積極正面但也要誠實提醒風險。`;
    }

    /**
     * 呼叫 Gemini API
     */
    async callGeminiAPI(prompt) {
        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API 請求失敗: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    /**
     * 格式化 AI 回應
     */
    formatResponse(response) {
        return `🤖 **AI 智能分析**\n\n${response}\n\n---\n💡 *此分析僅供參考，投資有風險，請謹慎評估*`;
    }

    /**
     * 當 AI API 失敗時的備用分析
     */
    getFallbackAnalysis(data) {
        const lastData = data.stockDatas[data.stockDatas.length - 1];
        let analysis = "🤖 **智能分析** (離線模式)\n\n";

        // 簡單的規則式分析
        if (lastData.MA5 && lastData.MA20) {
            if (lastData.MA5 > lastData.MA20) {
                analysis += "📈 **趨勢**: 目前短期趨勢偏多，5日均線在20日均線之上\n";
            } else {
                analysis += "📉 **趨勢**: 目前短期趨勢偏空，5日均線在20日均線之下\n";
            }
        }

        if (lastData.RSI) {
            if (lastData.RSI > 70) {
                analysis += "⚠️ **RSI警示**: 目前處於超買區域，注意回檔風險\n";
            } else if (lastData.RSI < 30) {
                analysis += "💡 **RSI機會**: 目前處於超賣區域，可能有反彈機會\n";
            } else {
                analysis += "✅ **RSI狀態**: 目前在正常區間，無明顯超買超賣\n";
            }
        }

        analysis += "\n💡 *建議搭配其他資訊綜合判斷，投資請謹慎評估風險*";
        return analysis;
    }
}

export default AIAnalyzer;