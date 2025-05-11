import BaseComponent from "./BaseComponent.js";
import Ajax from "./component/ajax.js";
import eventBus from "./component/eventBus.js";
class Text extends BaseComponent {
    constructor(id, model) {
        super(id);
        this.saveBTN = this.iframe.querySelector("#saveBTN");
        this.closeBTN = this.iframe.querySelector("#closeBTN");
    }

    init() {
        this.setEvent(this.saveBTN, "click", () => {
            try {
                const form = this.iframe.querySelector("form");
                await Ajax.conn({
                    type: "post", url: "/api/File/SaveText", data: new FormData(form), contentType: "application/x-www-form-urlencoded"
                }).catch(error => {
                    eventBus.emit("error", error.message);
                });
            } catch (error) {
                eventBus.emit("error", error.message);
            }
        });

        this.setEvent(this.closeBTN, "click", (e) => {
            this.iframe.querySelector("#closeWindow").click();
        });

    }


}

export default Text;