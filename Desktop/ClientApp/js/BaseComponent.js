/**
 * 基本物件模組
 * @param {string} id 元素ID
 */
class BaseComponent {
    constructor(id) {
        this.id = id;
        this.iframe = document.getElementById(id);
        this._events = [];
        this._destroyed = false;

        if (!this.iframe) {
            throw new Error(JSON.stringify({ title: "系統錯誤", msg: "✖開啟失敗" }));
        }
    }

    /**設置事件*/
    setEvent(element, event, handler) {
        element.addEventListener(event, handler);
        this._events.push({ element, event, handler });
    }

    /**清除所有事件*/
    clearEvents() {
        this._events.forEach(event => {
            window.removeEventListener(event.type, event.handler);
        });
        this._events = [];
    }

     /**銷毀*/
    destroy() {
        if (this._destroyed) return;

        this._destroyed = true;

        this.clearEvents();
        this.iframe = null;
    }

    get isDestoroyed() {
        return this._destroyed;
    }
}

export default BaseComponent;