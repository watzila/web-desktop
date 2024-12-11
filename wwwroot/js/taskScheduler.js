import Ajax from "./component/ajax.js";

class TaskScheduler {
    constructor() {
        this.runEles;
        this.init();
    }

    init() {
        this.runEles = document.querySelectorAll(".run");
        this.stopEles = document.querySelectorAll(".stop");

        this.runEles.forEach((v, k) => {
            v.onclick = () => {
                Ajax.conn({
                    type: "get", url: "/TaskScheduler/Run?path=" + encodeURI(v.value)
                });
            };
        });

        this.stopEles.forEach((v, k) => {
            v.onclick = () => {
                Ajax.conn({
                    type: "get", url: "/TaskScheduler/Stop?path=" + encodeURI(v.value)
                });
            };
        });
    }

}

new TaskScheduler();