import TemplateEngine from "./TemplateEngine.js";

export default class WindowManager {
    constructor(rootId) {
        this.root = document.getElementById(rootId);
    }

    async createWindow(config, data) {
        const layoutHtml = await TemplateEngine.view("./apps/windowLayout.html", config);
        const contentHtml = await TemplateEngine.view(`./apps/${config.appId}/index.html`, data);

        let frag = document.createRange().createContextualFragment(layoutHtml);
        const winEle = frag.firstChild;
        const contentArea = winEle.querySelector("main.iframe");
        contentArea.innerHTML = contentHtml;
        this.root.appendChild(winEle);

        return contentArea;
    }

}
