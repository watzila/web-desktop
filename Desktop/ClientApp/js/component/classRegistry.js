/**功能類別載入*/
class ClassRegistry {
    static cache = new Map();
    /**
     * 類別載入
     * @param {string} name 檔名
     */
    static async loadClass(name) {
        if (!name) return null;

        if (this.cache.has(name)) {
            return this.cache.get(name);
        }

        try {
            const module = await import(`../${name}.js`);
            this.cache.set(name, module.default);
            return module.default;
        } catch (error) {
            console.log(error);
            throw new Error(JSON.stringify({ title: "系統錯誤", msg: `✖無法載入類別：${name}` }));
        }
    }
}

export default ClassRegistry;