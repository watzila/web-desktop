class EventBus extends EventTarget {
    emit(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    on(eventName, callback) {
        this.addEventListener(eventName, (event) => callback(event.detail));
    }
}

const eventBus = new EventBus();
export default eventBus;