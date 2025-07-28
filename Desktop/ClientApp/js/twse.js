import BaseComponent from "./BaseComponent.js";
import Ajax from "./component/ajax.js";
import eventBus from "./component/eventBus.js";
class Twse extends BaseComponent {
    constructor(id, model) {
        super(id);
        this.searchBTN = this.iframe.querySelector("#searchBTN");
        this.suggestionEle = this.iframe.querySelector("#suggestion");
        this.init();
    }

    init() {
        this.setEvent(this.searchBTN, "click", () => {
            const stockId = this.iframe.querySelector("input[name=stockId]").value;
            if (!stockId) {
                eventBus.emit("error", "請輸入股票代號");
                return;
            }
            Ajax.conn({
                type: "post",
                url: "/api/Twse/Stock",
                data: { id: stockId },
                fn: (result) => {
                    if (result.returnCode === 200) {
                        //console.log(JSON.stringify(result))
                        this.updateStockData(result.returnData, stockId);
                    } else {
                        eventBus.emit("error", result.returnMsg);
                    }
                }, contentType: "application/json"
            }).catch(error => {
                eventBus.emit("error", error.message);
            });
        });
    }

    updateStockData(data, stockId) {
        if (!data || !data.stockDatas || data.stockDatas.length === 0) {
            eventBus.emit("error", "沒有找到股票數據");
            return;
        }

        const latestData = data.stockDatas[data.stockDatas.length - 1];
        
        // 更新股票基本資訊
        this.updateStockInfo(latestData, stockId);
        
        // 更新技術指標
        this.updateIndicators(latestData);
        
        // 更新詳細技術指標
        this.updateDetailedIndicators(latestData);
        
        // 更新策略建議
        this.updateSuggestion(data.suggestion || "暫無建議");
        
        // 更新綜合分析
        if (data.comprehensiveAnalysis) {
            this.updateComprehensiveAnalysis(data.comprehensiveAnalysis);
        }
        
        // 顯示分析結果區域
        const analysisResults = this.iframe.querySelector("#analysisResults");
        if (analysisResults) {
            analysisResults.style.display = "block";
        }
    }

    updateStockInfo(stockData, stockId) {
        // 更新股票代碼
        const stockCodeElement = this.iframe.querySelector(".stock-code");
        if (stockCodeElement) {
            stockCodeElement.textContent = `${stockId}`;
        }

        // 更新所有價格項目
        const priceItems = this.iframe.querySelectorAll(".price-item");
        
        // 收盤價
        if (priceItems[0]) {
            const valueElement = priceItems[0].querySelector(".value");
            if (valueElement) {
                valueElement.textContent = stockData.close ? stockData.close.toFixed(2) : "N/A";
            }
        }

        // 漲跌
        if (priceItems[1] && stockData.priceChange !== undefined) {
            const changeElement = priceItems[1].querySelector(".value");
            if (changeElement) {
                const changePercent = stockData.close ? ((stockData.priceChange / (stockData.close - stockData.priceChange)) * 100) : 0;
                const changeText = `${stockData.priceChange > 0 ? '+' : ''}${stockData.priceChange.toFixed(2)} (${changePercent.toFixed(2)}%)`;
                changeElement.textContent = changeText;
                
                // 更新漲跌顏色
                changeElement.className = `value change ${stockData.priceChange >= 0 ? 'positive' : 'negative'}`;
            }
        }

        // 成交量
        if (priceItems[2]) {
            const volumeElement = priceItems[2].querySelector(".value");
            if (volumeElement) {
                volumeElement.textContent = stockData.volume ? stockData.volume.toLocaleString() : "N/A";
            }
        }

        // 日期
        if (priceItems[3] && stockData.date) {
            const dateElement = priceItems[3].querySelector(".value");
            if (dateElement) {
                dateElement.textContent = stockData.date;
            }
        }
    }

    updateIndicators(stockData) {
        const indicators = this.iframe.querySelectorAll(".indicator-item");
        
        indicators.forEach((indicator, index) => {
            const nameElement = indicator.querySelector(".indicator-name");
            const valueElement = indicator.querySelector(".indicator-value");
            const statusElement = indicator.querySelector(".indicator-status");
            
            if (!nameElement || !valueElement || !statusElement) return;
            
            switch (index) {
                case 0: // RSI
                    if (stockData.rsi !== null && stockData.rsi !== undefined) {
                        valueElement.textContent = stockData.rsi.toFixed(2);
                        this.updateIndicatorStatus(statusElement, stockData.rsi, 30, 70, "RSI");
                    } else {
                        valueElement.textContent = "計算中";
                        statusElement.textContent = "待計算";
                        statusElement.className = "indicator-status neutral";
                    }
                    break;
                case 1: // MA5
                    if (stockData.ma5 !== null && stockData.ma5 !== undefined) {
                        valueElement.textContent = stockData.ma5.toFixed(2);
                        this.updateIndicatorStatus(statusElement, stockData.close, stockData.ma5, null, "MA");
                    } else {
                        valueElement.textContent = "計算中";
                        statusElement.textContent = "待計算";
                        statusElement.className = "indicator-status neutral";
                    }
                    break;
                case 2: // MA20
                    if (stockData.ma20 !== null && stockData.ma20 !== undefined) {
                        valueElement.textContent = stockData.ma20.toFixed(2);
                        this.updateIndicatorStatus(statusElement, stockData.close, stockData.ma20, null, "MA");
                    } else {
                        valueElement.textContent = "計算中";
                        statusElement.textContent = "待計算";
                        statusElement.className = "indicator-status neutral";
                    }
                    break;
                case 3: // MACD
                    if (stockData.dif !== null && stockData.dif !== undefined) {
                        valueElement.textContent = stockData.dif.toFixed(4);
                        this.updateIndicatorStatus(statusElement, stockData.dif, 0, null, "MACD");
                    } else {
                        valueElement.textContent = "計算中";
                        statusElement.textContent = "待計算";
                        statusElement.className = "indicator-status neutral";
                    }
                    break;
                case 4: // KD-K
                    if (stockData.k !== null && stockData.k !== undefined) {
                        valueElement.textContent = stockData.k.toFixed(2);
                        this.updateIndicatorStatus(statusElement, stockData.k, 20, 80, "KD");
                    } else {
                        valueElement.textContent = "計算中";
                        statusElement.textContent = "待計算";
                        statusElement.className = "indicator-status neutral";
                    }
                    break;
                case 5: // KD-D
                    if (stockData.d !== null && stockData.d !== undefined) {
                        valueElement.textContent = stockData.d.toFixed(2);
                        this.updateIndicatorStatus(statusElement, stockData.d, 20, 80, "KD");
                    } else {
                        valueElement.textContent = "計算中";
                        statusElement.textContent = "待計算";
                        statusElement.className = "indicator-status neutral";
                    }
                    break;
                case 6: // 成交量比
                    if (stockData.volume && stockData.vma5) {
                        const volumeRatio = (stockData.volume / stockData.vma5).toFixed(2);
                        valueElement.textContent = volumeRatio;
                        this.updateIndicatorStatus(statusElement, parseFloat(volumeRatio), 0.7, 1.5, "VOLUME");
                    } else {
                        valueElement.textContent = "計算中";
                        statusElement.textContent = "待計算";
                        statusElement.className = "indicator-status neutral";
                    }
                    break;
                case 7: // 量價關係
                    if (stockData.priceVolumeRelation) {
                        valueElement.textContent = stockData.priceVolumeRelation;
                        this.updateIndicatorStatus(statusElement, stockData.priceVolumeRelation, null, null, "PRICE_VOLUME");
                    } else {
                        valueElement.textContent = "計算中";
                        statusElement.textContent = "待計算";
                        statusElement.className = "indicator-status neutral";
                    }
                    break;
            }
        });
    }

    updateIndicatorStatus(statusElement, value, threshold1, threshold2, type) {
        let status = "neutral";
        let text = "中性";
        
        switch (type) {
            case "RSI":
                if (value > threshold2) {
                    status = "bearish";
                    text = "超買";
                } else if (value < threshold1) {
                    status = "bullish";
                    text = "超賣";
                }
                break;
            case "MA":
                if (value > threshold1) {
                    status = "bullish";
                    text = "多頭";
                } else {
                    status = "bearish";
                    text = "空頭";
                }
                break;
            case "MACD":
                if (value > 0) {
                    status = "bullish";
                    text = "多頭";
                } else {
                    status = "bearish";
                    text = "空頭";
                }
                break;
            case "KD":
                if (value > threshold2) {
                    status = "bearish";
                    text = "超買";
                } else if (value < threshold1) {
                    status = "bullish";
                    text = "超賣";
                }
                break;
            case "VOLUME":
                if (value > threshold2) {
                    status = "bullish";
                    text = "放量";
                } else if (value < threshold1) {
                    status = "bearish";
                    text = "縮量";
                }
                break;
            case "PRICE_VOLUME":
                if (value === "價漲量增") {
                    status = "bullish";
                    text = "健康";
                } else if (value === "價跌量增") {
                    status = "bearish";
                    text = "恐慌";
                } else if (value === "價漲量縮") {
                    status = "neutral";
                    text = "觀望";
                } else if (value === "價跌量縮") {
                    status = "neutral";
                    text = "止跌";
                } else {
                    status = "neutral";
                    text = "盤整";
                }
                break;
        }
        
        statusElement.className = `indicator-status ${status}`;
        statusElement.textContent = text;
    }

    updateDetailedIndicators(stockData) {
        // 更新詳細技術指標數值
        const indicators = {
            'ema12-value': stockData.ema12,
            'ema26-value': stockData.ema26,
            'macd-signal-value': stockData.macd,
            'macd-osc-value': stockData.osc,
            'rsv-value': stockData.rsv,
            'vma5-value': stockData.vma5,
            'vma20-value': stockData.vma20,
            'ma10-value': stockData.ma10
        };

        Object.entries(indicators).forEach(([id, value]) => {
            const element = this.iframe.querySelector(`#${id}`);
            if (element) {
                if (value !== null && value !== undefined) {
                    if (id.includes('vma')) {
                        // 成交量用千股為單位
                        element.textContent = `${(value / 1000).toFixed(0)}K股`;
                    } else {
                        element.textContent = typeof value === 'number' ? value.toFixed(4) : value;
                    }
                } else {
                    element.textContent = "計算中";
                }
            }
        });
    }

    updateSuggestion(suggestion) {
        const suggestionElement = this.iframe.querySelector("#suggestion");
        if (suggestionElement) {
            // 處理換行符號和格式化
            const formattedSuggestion = suggestion
                .replace(/\\n/g, '\n')  // 處理轉義的換行符
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // 處理粗體
                .replace(/\n/g, '<br>');  // 換行符轉為HTML
            
            suggestionElement.innerHTML = formattedSuggestion;
        }
    }

    updateComprehensiveAnalysis(analysis) {
        // 更新綜合評分
        const scoreElement = this.iframe.querySelector(".score-value");
        if (scoreElement && analysis.score !== undefined) {
            scoreElement.textContent = analysis.score.toFixed(1);
        }

        // 更新風險等級
        const riskElement = this.iframe.querySelector(".risk-badge");
        if (riskElement && analysis.riskLevel) {
            riskElement.textContent = analysis.riskLevel;
            riskElement.className = `risk-badge ${this.getRiskClass(analysis.riskLevel)}`;
        }

        // 更新交易信號
        if (analysis.signals && analysis.signals.length > 0) {
            this.updateSignals(analysis.signals);
        } else {
            // 如果沒有信號，顯示預設訊息
            const signalsContainer = this.iframe.querySelector(".signals-list");
            if (signalsContainer) {
                signalsContainer.innerHTML = '<div class="no-signals">暫無明確交易信號</div>';
            }
        }

        // 更新趨勢分析 - 檢查不同的可能屬性名稱
        const trends = analysis.trends || analysis.trend || [];
        if (trends.length > 0) {
            this.updateTrends(trends);
        }

        // 更新動能分析
        if (analysis.momentum && analysis.momentum.length > 0) {
            this.updateMomentum(analysis.momentum);
        }
    }

    getRiskClass(riskLevel) {
        switch (riskLevel) {
            case "低風險": return "low";
            case "中風險": return "medium";
            case "高風險": return "high";
            default: return "medium";
        }
    }

    updateSignals(signals) {
        const signalsContainer = this.iframe.querySelector(".signals-list");
        if (!signalsContainer) return;

        signalsContainer.innerHTML = "";
        signals.forEach(signal => {
            const signalElement = document.createElement("div");
            signalElement.className = `signal-item ${signal.type === "買進" ? "buy" : "sell"}`;
            
            const icon = signal.type === "買進" ? "📈" : "📉";
            const strengthText = signal.strength === "強" ? "強烈" : signal.strength === "中" ? "中等" : "弱";
            
            signalElement.innerHTML = `
                <div class="signal-content">
                    <div class="signal-type">${icon} ${signal.type}</div>
                    <div class="signal-reason">${signal.reason}</div>
                </div>
                <div class="signal-strength ${signal.strength}">${strengthText}</div>
            `;
            signalsContainer.appendChild(signalElement);
        });
    }

    updateTrends(trends) {
        const trendContainer = this.iframe.querySelector(".trend-content");
        if (!trendContainer) return;

        trendContainer.innerHTML = "";
        trends.forEach(trend => {
            const trendElement = document.createElement("div");
            trendElement.className = "analysis-item";
            trendElement.textContent = trend;
            trendContainer.appendChild(trendElement);
        });
    }

    updateMomentum(momentum) {
        const momentumContainer = this.iframe.querySelector(".momentum-content");
        if (!momentumContainer) return;

        momentumContainer.innerHTML = "";
        momentum.forEach(item => {
            const momentumElement = document.createElement("div");
            momentumElement.className = "analysis-item";
            momentumElement.textContent = item;
            momentumContainer.appendChild(momentumElement);
        });
    }
}

export default Twse;