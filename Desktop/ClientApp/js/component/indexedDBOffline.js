import homeApi from "../api/Home.js";
import musicApi from "../api/Music.js";
import aquariumApi from "../api/Aquarium.js";
import folderApi from "../api/Folder.js";
import fileApi from "../api/File.js";
import timeApi from "../api/Time.js";
import twseApi from "../api/Twse.js";
class IndexedDBOffline {
    constructor() {
        this.api = {};
        this._initialized = false;
        this.dbVersion;
        this.dbName;
        this.ready = this.init();
        this.registerAPI();
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;

        const dbData = await this.getData();
        if (!dbData) {
            console.error('❌ 無法載入 db.json');
            return;
        }

        this.dbName = dbData.name;
        this.dbVersion = dbData.version;

        // 確保有效的數據庫名稱和版本
        if (!this.dbName || !this.dbVersion) {
            console.error('❌ db.json 格式錯誤：缺少 name 或 version');
            return;
        }

        const req = indexedDB.open(this.dbName, this.dbVersion);

        req.onupgradeneeded = (event) => {
            const db = event.target.result;
            const tx = event.target.transaction;

            dbData.schemas.forEach((schema) => {
                let objectStore;

                if (!db.objectStoreNames.contains(schema.name)) {
                    objectStore = db.createObjectStore(schema.name, schema.keyPath);
                } else {
                    objectStore = tx.objectStore(schema.name);
                }

                const desiredIndexes = new Set(schema.indexes.map(a => a.keyPath) || []);
                const existingIndexes = new Set(objectStore.indexNames);

                schema.indexes.forEach((a) => {
                    if (!existingIndexes.has(a.keyPath)) {
                        objectStore.createIndex(a.keyPath, a.keyPath, a.options || { "unique": false });
                    }
                });

                existingIndexes.forEach((indexName) => {
                    if (!desiredIndexes.has(indexName)) {
                        objectStore.deleteIndex(indexName);
                    }
                });

            });

            tx.oncomplete = () => {
                console.log("📦 IndexedDB 初始化完成");
            };

            tx.onerror = (err) => {
                //console.error("❌ IndexedDB 寫入錯誤", err);
                throw new Error(JSON.stringify({ title: "IndexedDB", msg: "✖初始化失敗" }));
            };
        };

        req.onsuccess = (event) => {
            const db = event.target.result;
            dbData.schemas.forEach((schema) => {
                if (dbData.seedData[schema.name] && dbData.seedData[schema.name].length > 0) {
                    const tx = db.transaction(schema.name, "readwrite");
                    const store = tx.objectStore(schema.name);

                    dbData.seedData[schema.name].forEach((record) => {
                        const key = record[schema.keyPath.keyPath];
                        const getReq = store.get(key);
                        getReq.onsuccess = (e) => {
                            if (!e.target.result) {
                                const addReq = store.add(record);
                                addReq.onerror = (err) => {
                                    console.error("❌ 預設資料寫入錯誤", err);
                                };
                            }
                        };
                        getReq.onerror = (err) => {
                            console.error("❌ 預設資料讀取錯誤", err);
                        };

                    });

                    console.log(`📦 IndexedDB 預設資料寫入完成`);
                }
            });
        };

    }

    /**
     * 取得資料庫資料
     */
    getData() {
        return fetch("./db.json")
            .then((res) => res.json())
            .then((json) => json)
            .catch((err) => {
                console.error(err);
                return null;
            });
    }

    /**
     * 註冊API
     */
    registerAPI() {
        const apiList = [homeApi, musicApi, aquariumApi, folderApi, fileApi, timeApi, twseApi];
        apiList.forEach(api => {
            for (const [url, handler] of Object.entries(api)) {
                this.api[url] = async (data) => handler(this, data);
            }
        });
    }

    /**
     * 連線
     * @param {string} url 連線地址
     * @param {object} data 要傳送的物件
     * @returns {Promise<{returnCode:number,returnMsg:string,returnData:object}>}
     */
    conn(url, data) {
        return new Promise((resolve, reject) => {
            if (this.api[url]) {
                try {
                    const result = this.api[url](data);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error("✖找不到此頁面"));
            }
        });
    }

    /**
     * 取得資料庫實體
     * @returns {Promise<IDBDatabase>}
     */
    getDBInstance() {
        return new Promise((resolve, reject) => {
            // 檢查數據庫名稱是否已初始化
            if (!this.dbName || !this.dbVersion) {
                reject(new Error('IndexedDB 尚未初始化'));
                return;
            }

            const req = indexedDB.open(this.dbName, this.dbVersion);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (err) => reject(err);
        });
    }

    /**
     * 取得資料庫資料
     * @param {IDBDatabase} db
     * @param {string} storeName
     * @param {function} filterFn
     * @param {object} options
     * @returns {Promise<Array>}
     */
    getStore(db, storeName, filterFn = () => true, options = {}) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const result = [];

            const req = store.openCursor();
            req.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (filterFn(cursor.value)) {
                        result.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    if (options.sortBy) {
                        result.sort((a, b) => (a[options.sortBy] ?? 0) - (b[options.sortBy] ?? 0));
                    }
                    resolve(result);
                }
            };

            req.onerror = (err) => {
                //console.error("❌ IndexedDB 讀取錯誤", err);
                reject(new Error("✖讀取錯誤"));
            };
        });
    }

    /**
     * 寫入資料
     * @param {IDBDatabase} db
     * @param {string} storeName
     * @param {object} data
     * @returns {Promise<void>}
     */
    writeStore(db, storeName, data) {
        return new Promise((resolve, reject) => {
            const req = db.transaction(storeName, "readwrite").objectStore(storeName).add(data);
            req.onsuccess = () => {
                //console.log("✅ IndexedDB 寫入成功");
                resolve();
            };
            req.onerror = (err) => {
                //console.error("❌ IndexedDB 寫入錯誤", err);
                reject(new Error("✖新增失敗"));
            };
        });
    }

    /**
     * 更新資料
     * @param {IDBDatabase} db
     * @param {string} storeName
     * @param {object} data
     * @param {string} id
     * @returns {Promise<void>}
     */
    updateStore(db, storeName, data, id) {
        return new Promise((resolve, reject) => {
            const store = db.transaction(storeName, "readwrite").objectStore(storeName);
            const req = store.get(id);
            req.onsuccess = () => {
                const result = req.result;
                if (!result) {
                    reject(new Error("✖更新失敗"));
                    return;
                }

                Object.assign(result, data);
                const put = store.put(result);
                put.onsuccess = () => {
                    resolve();
                };
                put.onerror = () => {
                    reject(new Error("✖更新失敗"));
                };
            };
            req.onerror = (err) => {
                //console.error("❌ IndexedDB 寫入錯誤", err);
                reject(new Error("✖更新錯誤"));
            };
        });
    }

    /**
     * 刪除資料
     * @param {IDBDatabase} db
     * @param {string} storeName
     * @param {string} id
     * @returns {Promise<void>}
     */
    deleteStore(db, storeName, id) {
        return new Promise((resolve, reject) => {
            const req = db.transaction(storeName, "readwrite").objectStore(storeName).delete(id);
            req.onsuccess = () => {
                //console.log("✅ IndexedDB 刪除成功");
                resolve();
            };
            req.onerror = (err) => {
                //console.error("❌ IndexedDB 刪除錯誤", err);
                reject(new Error("✖刪除錯誤"));
            };
        });
    }

    /**創建Guid*/
    newid() {
        let d = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    /**
     * FormData轉物件
     * @param {FormData} formData
     */
    formDataToObj(formData) {
        const obj = {};
        if (!(formData instanceof FormData)) {
            return obj;
        }

        for (const [key, value] of formData.entries()) {
            if (obj[key]) {
                if (!Array.isArray(obj[key])) {
                    obj[key] = [obj[key]];
                }
                obj[key].push(value);
            } else {
                obj[key] = value;
            }
        }

        return obj;
    }

}

export default IndexedDBOffline;