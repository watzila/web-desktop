import System from "./core/System.js";
import WindowManager from "./core/WindowManager.js";
import MusicApp from "./apps/Music/Music.js";

// 1. 初始化底層元件
const windowManager = new WindowManager("desktop");
const os = new System();

await os.init({
    windowManager: windowManager
});

// 2. 註冊 App (這部分可以從資料庫或 JSON 設定檔讀取)
os.registerApp({
    appId: "music",
    title: "音樂播放器",
    icon: "./images/music.png",
    width: 500,
    height: 300,
    AppClass: MusicApp
});

// 3. 測試：啟動一個 App
document.getElementById("btn-launch-music").onclick = () => {
    os.launchApp("music");
};
