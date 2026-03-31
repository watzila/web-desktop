import eventBus from "./eventBus.js";

/**html模板解析*/
class TemplateEngine {
    static render(template, data) {
        //console.log(data);
        return template
            .replace(/\{\{#each (.*?)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, arrayName, innerTemplate) => {
                let items = data[arrayName.trim()];
                if (!Array.isArray(items)) return "";
                return items.map((item, index) => this.render(innerTemplate, { ...item, "@index": index })).join("");
            })
            .replace(/\{\{#if (.*?)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, condition, innerTemplate) => {
                const [ifBlock, elseBlock = ""] = innerTemplate.split("{{#else}}");
                let result = false;
                try {
                    const safeKeys = Object.keys(data).filter(k => !k.startsWith("@"));
                    const func = new Function(...safeKeys, `return ${condition.trim()}`);
                    result = func(...safeKeys.map(k => data[k]));
                } catch (e) {
                    eventBus.emit("error", `解析失敗: ${condition}`);
                }

                return result ? this.render(ifBlock, data) : this.render(elseBlock, data);
            })
            .replace(/\{\{(.*?)\}\}/g, (_, key) => {
                return this.getValue(data, key.trim()) ?? "";
            });
    }

    static getValue(obj, path) {
        if (path === "@index") return obj["@index"];
        return path.split(".").reduce((acc, part) => acc?.[part], obj);
    }
    /**
     * 視圖
     * @param {string} html路徑
     * @param {object} 資料物件
     */
    static async view(path, data) {
        const response = await fetch(path);
        const template = await response.text();

        return this.render(template, data);
    }
}

export default TemplateEngine;