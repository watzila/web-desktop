export default class System {
    constructor() {
        this.apps = new Map();
        this.windowManager = null;
    }

    /**
     * 初始化系統
     * @param {Object} options 
     */
    async init(options = {}) {
        console.log("🚀 系統啟動中...");
        this.windowManager = options.windowManager;
    }

    /**
     * 註冊應用程式
     * @param {Object} appManifest App 的基本資訊
     */
    registerApp(appManifest) {
        this.apps.set(appManifest.appId, appManifest);
        console.log(`系統：已安裝： ${appManifest.title}`);
        // 這裡可以觸發在桌面建立圖示的邏輯
    }

    /**
     * 啟動應用程式
     * @param {string} appId 
     */
    async launchApp(appId) {
        const manifest = this.apps.get(appId);
        if (!manifest) {
            console.error(`❌ 找不到應用程式: ${appId}`);
            return;
        }

        const container = await this.windowManager.createWindow(manifest, {});

        const appInstance = new manifest.AppClass(container, {});
        await appInstance.init();
    }

}
