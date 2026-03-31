/**
 * 所有獨立 App 的基底類別
 */
export default class BaseApp {
    /**
     * @param {HTMLElement} container 
     * @param {Object} api 底層提供的系統功能 API
     */
    constructor(container, api) {
        this.container = container;
        this.api = api;
        this._events = [];
    }

    /**
     * 啟動 App 的入口
     */
    async init() {
    }

    on(ele, event, handler) {
        if (!ele) return;
        ele.addEventListener(event, handler);
        this._events.push({ ele, event, handler });
    }

    /**
     * 關閉 App 時要做的清理
     */
    destroy() {
        this._events.forEach(({ ele, event, handler }) => {
            ele.removeEventListener(event, handler);
        });
        this._events = [];
    }

}
