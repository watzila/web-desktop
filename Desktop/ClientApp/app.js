class App {
    constructor() {
        this.init();
    }

    init() {
        import("./pages/home.js");
    }
}

new App();