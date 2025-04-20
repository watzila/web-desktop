import Ajax from "./component/ajax.js";

class TaskScheduler {
    constructor(id) {
        this.iframeId = id;
        this.init();
    }

    init() {
        let runEles = document.querySelectorAll(`#${this.iframeId} .run`);
        let stopEles = document.querySelectorAll(`#${this.iframeId} .stop`);

        runEles.forEach((v, k) => {
            v.onclick = () => {
                Ajax.conn({
                    type: "get", url: "/TaskScheduler/Run?path=" + encodeURI(v.value)
                });
            };
        });

        stopEles.forEach((v, k) => {
            v.onclick = () => {
                Ajax.conn({
                    type: "get", url: "/TaskScheduler/Stop?path=" + encodeURI(v.value)
                });
            };
        });
    }

}

export default TaskScheduler;