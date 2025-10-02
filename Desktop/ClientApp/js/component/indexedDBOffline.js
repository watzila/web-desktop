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
        if (!dbData) return;
        this.dbName = dbData.name;
        this.dbVersion = dbData.version;

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
    async conn(url, data) {
        if (this.api[url]) {
            return await this.api[url](data);
        }

        return {
            returnCode: 404,
            returnMsg: "✖找不到此頁面",
            returnData: null,
            js: null
        }
    }

    /**
     * 取得資料庫實體
     * @returns {Promise<IDBDatabase>}
     */
    async getDBInstance() {
        return new Promise((resolve, reject) => {
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
                throw new Error(JSON.stringify({ title: "IndexedDB", msg: "✖讀取錯誤" }));
                reject(err);
            };
        });
    }

    /**
     * 寫入資料
     * @param {IDBDatabase} db
     * @param {string} storeName
     * @param {object} data
     */
    writeStore(db, storeName, data) {
        const req = db.transaction(storeName, "readwrite").objectStore(storeName).add(data);
        req.onsuccess = () => {
            //console.log("✅ IndexedDB 寫入成功");
        };
        req.onerror = (err) => {
            //console.error("❌ IndexedDB 寫入錯誤", err);
            throw new Error(JSON.stringify({ title: "IndexedDB", msg: "✖新增失敗" }));
        };
    }

    /**
     * 刪除資料
     * @param {IDBDatabase} db
     * @param {string} storeName
     * @param {string} id
     */
    deleteStore(db, storeName, id) {
        const req = db.transaction(storeName, "readwrite").objectStore(storeName).delete(id);
        req.onsuccess = () => {
            //console.log("✅ IndexedDB 刪除成功");
        };
        req.onerror = (err) => {
            //console.error("❌ IndexedDB 刪除錯誤", err);
            throw new Error(JSON.stringify({ title: "IndexedDB", msg: "✖刪除失敗" }));
        };
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

}

export default IndexedDBOffline;