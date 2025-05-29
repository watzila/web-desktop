# web-desktop

一個「純原生技術」打造的仿 Windows 桌面風格 Web 應用，使用多視窗操作與模組化功能設計，強調模組獨立性與簡潔架構。

設計初衷是實驗「每個功能模組可獨立增減、不影響其他模組」的桌面環境，靈感來自 Windows應用程式點開即用。

---

## 📦 專案架構

* **前端**：原生 JS + HTML + CSS（不依賴任何前端框架）
* **後端**：.NET Core 8 Web API（需使用sql server）或 indexeddb瀏覽器存取
* **模組化設計**：每個功能模組可獨立增減，避免相依過深

---

## 🖥️ 線上體驗

> [https://watzila.github.io/web-desktop/Desktop/ClientApp/](https://watzila.github.io/web-desktop/Desktop/ClientApp/)

建議使用桌機版瀏覽器體驗。手機版未特別優化可能會出現錯誤。

---

## ✨ 功能介紹
>「 功能模組設計自由，想加什麼就加什麼 」

### 🪟 多視窗系統

* 支援基本視窗控制（拖曳、視窗四角縮放、最小化、關閉）
* 每個模組皆以視窗呈現，模擬桌面操作體驗

### 🎵 音樂播放器

* YouTube連結 (使用 Iframe API)
* 播放 / 暫停控制
* 讀取本地音樂 (開發中)

![音樂播放器](https://github.com/user-attachments/assets/f9ac5a3a-8ea4-432c-928e-343884d5248b)

### 📓 記事本（開發中）

* 支援打開、儲存純文字

---

## 📚 使用與開發方式

### 本地端開發

1. 使用 Visual Studio 開啟後端 `.NET Web API` 專案
2. 前端程式位於 `Desktop/ClientApp/` 資料夾內

### GitHub Pages 部署
修改`Desktop/ClientApp/js/component/ajax.js`開啟使用IndexedDB瀏覽器資料存取
```
static enableOffline = true;
```
預設資料`Desktop/ClientApp/db.json`

---

## ⚙️ 技術細節

| 技術                | 說明                         |
| ----------------- | -------------------------- |
| JavaScript Module | 使用 `type="module"` 管理模組化載入 |
| Iframe API        | 使用 YouTube 提供的嵌入式播放控制      |
| Template 模板系統  | 簡易模板系統，透過js讀取html替換文字插入資料 |
| .NET Web API      | 提供後端接資料庫存取    |
| IndexedDB         | 提供瀏覽器資料存取    |

---

## 🧾 授權 License

本專案採用 [Apache-2.0](./LICENSE.txt) 授權。歡迎自由使用、學習與改作，但請遵守相關授權條款。

---

## 🙋‍♂️ 作者

由 [@watzila](https://github.com/watzila) 自行開發與維護。如有任何建議、想法或想互相討論，歡迎開 Issue 或交流。
