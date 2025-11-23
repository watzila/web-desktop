import BaseComponent from "./BaseComponent.js";
import Ajax from "./component/ajax.js";
import eventBus from "./component/eventBus.js";
class Twse extends BaseComponent {
    constructor(id, model) {
        super(id);
        this.searchBTN = this.iframe.querySelector("#searchBTN");
        this.suggestionEle = this.iframe.querySelector("#suggestion");
        this.navEle = this.iframe.querySelector("nav");
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
                        this.updateStockData(result.returnData);
                    } else {
                        eventBus.emit("error", result.returnMsg);
                    }
                }, contentType: "application/json"
            }).catch(error => {
                eventBus.emit("error", error.message);
            });
        });

        this.setEvent(this.navEle.querySelector("#aboutBTN"), "click", () => {
            this.iframe.querySelector("#aboutWrap").show();
        });
    }

    updateStockData(data) {
        if (!data) {
            eventBus.emit("error", "沒有找到股票數據");
            return;
        }

        // 直接使用已處理好的數據進行渲染
        this.renderStockInfo(data.stockInfo);
        this.renderIndicators(data.indicators);
        this.renderDetailedIndicators(data.detailedIndicators);
        this.renderAnalysis(data.analysis);
        this.renderSuggestion(data.suggestion);

        // 顯示分析結果區域
        const analysisResults = this.iframe.querySelector("#analysisResults");
        if (analysisResults) {
            analysisResults.style.display = "block";
        }
    }

    //股票資訊
    renderStockInfo(stockInfo) {
        if (!stockInfo) return;

        // 更新股票代碼
        this.iframe.querySelector(".stock-code").textContent = stockInfo.stockId;

        const priceItems = this.iframe.querySelectorAll(".price-item");

        // 收盤價
        priceItems[0].querySelector(".value").textContent = stockInfo.close;

        // 漲跌 (已格式化)
        const changeElement = priceItems[1].querySelector(".value");
        changeElement.textContent = stockInfo.change;
        changeElement.className = `value change ${stockInfo.changeClass}`;

        // 成交量 (已格式化)
        priceItems[2].querySelector(".value").textContent = stockInfo.volume;

        // 日期
        priceItems[3].querySelector(".value").textContent = stockInfo.date;
    }

    //技術指標
    renderIndicators(indicators) {
        if (!indicators || !Array.isArray(indicators)) return;

        const indicatorElements = this.iframe.querySelectorAll(".indicator-item");

        indicators.forEach((indicator, index) => {
            if (index >= indicatorElements.length) return;

            const indicatorElement = indicatorElements[index];
            const nameElement = indicatorElement.querySelector(".indicator-name");
            const valueElement = indicatorElement.querySelector(".indicator-value");
            const statusElement = indicatorElement.querySelector(".indicator-status");

            if (!nameElement || !valueElement || !statusElement) return;

            // 直接使用已處理好的數據
            nameElement.textContent = indicator.name;
            valueElement.textContent = indicator.value;
            statusElement.textContent = indicator.status;
            statusElement.className = `indicator-status ${indicator.statusClass}`;

            // 設置 title 屬性作為提示
            indicatorElement.title = indicator.description;
        });
    }

    //詳細技術指標
    renderDetailedIndicators(stockData) {
        const indicators = {
            'ema12-value': stockData.ema12,
            'ema26-value': stockData.ema26,
            'macd-signal-value': stockData.macdSignal,
            'macd-osc-value': stockData.macdOsc,
            'rsv-value': stockData.rsv,
            'vma5-value': stockData.vma5,
            'vma20-value': stockData.vma20,
            'ma10-value': stockData.ma10
        };

        Object.entries(indicators).forEach(([id, value]) => {
            const element = this.iframe.querySelector(`#${id}`);
            if (element && value !== null && value !== undefined) {
                element.textContent = value;
            }
        });
    }

    //策略建議
    renderSuggestion(suggestion) {
        const suggestionElement = this.iframe.querySelector("#suggestion");
        suggestionElement.innerHTML = suggestion;
    }

    renderAnalysis(analysis) {
        if (!analysis) return;

        // 更新綜合評分
        const scoreElement = this.iframe.querySelector(".score-value");
        if (scoreElement) {
            scoreElement.textContent = analysis.score.toFixed(1);
        }

        // 更新風險等級 (直接使用已處理的 riskClass)
        const riskElement = this.iframe.querySelector(".risk-badge");
        if (riskElement) {
            riskElement.textContent = analysis.riskLevel;
            riskElement.className = `risk-badge ${analysis.riskClass}`;
        }

        // 更新交易信號
        this.renderSignals(analysis.signals);

        // 更新趨勢分析
        this.renderTrends(analysis.trends);

        // 更新動能分析
        this.renderMomentum(analysis.momentum);
    }


    renderSignals(signals) {
        const signalsContainer = this.iframe.querySelector(".signals-list");
        if (!signalsContainer) return;

        if (!signals || signals.length === 0) {
            signalsContainer.innerHTML = '<div class="no-signals">暫無明確交易信號</div>';
            return;
        }

        signalsContainer.innerHTML = "";
        signals.forEach(signal => {
            const signalElement = document.createElement("div");
            signalElement.className = `signal-item ${signal.typeClass}`;
            signalElement.innerHTML = `
                <div class="signal-content">
                    <div class="signal-type">${signal.icon} ${signal.type}</div>
                    <div class="signal-reason">${signal.reason}</div>
                </div>
                <div class="signal-strength ${signal.strengthClass}">${signal.strength}</div>`;
            signalsContainer.appendChild(signalElement);
        });
    }

    renderTrends(trends) {
        const trendContainer = this.iframe.querySelector(".trend-content");
        if (!trendContainer) return;

        trendContainer.innerHTML = "";
        if (trends && trends.length > 0) {
            trends.forEach(trend => {
                const trendElement = document.createElement("div");
                trendElement.className = "analysis-item";
                trendElement.textContent = trend;
                trendContainer.appendChild(trendElement);
            });
        }
    }

    renderMomentum(momentum) {
        const momentumContainer = this.iframe.querySelector(".momentum-content");
        if (!momentumContainer) return;

        momentumContainer.innerHTML = "";
        if (momentum && momentum.length > 0) {
            momentum.forEach(item => {
                const momentumElement = document.createElement("div");
                momentumElement.className = "analysis-item";
                momentumElement.textContent = item;
                momentumContainer.appendChild(momentumElement);
            });
        }
    }
}

export default Twse;