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
                        this.suggestionEle.innerText = result.returnData.suggestion;
                    } else {
                        eventBus.emit("error", result.returnMsg);
                    }
                }, contentType: "application/json"
            }).catch(error => {
                eventBus.emit("error", error.message);
            });
        });
    }
}

export default Twse;