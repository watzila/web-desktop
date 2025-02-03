/**功能類別載入*/
class ClassRegistry {
    /**
     * 類別載入
     * @param {string} name 檔名
     */
    static async loadClass(name) {
        if (!name) return null;

        try {
            const module = await import(`./${name}.js`);
            return module.default;
        } catch (error) {
            throw new Error(JSON.stringify({ title: "系統錯誤", msg: `✖無法載入類別：${name}` }));
        }
    }
}

export default ClassRegistry;