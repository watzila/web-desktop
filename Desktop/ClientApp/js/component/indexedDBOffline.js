class IndexedDBOffline {
    constructor() {
        this.api = {};
        this._initialized = false;

        this.ready = this.init();
        this.registerAPI();
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;

        const dbData = await this.getData();
        if (!dbData) return;
        const req = indexedDB.open("DesktopDB", 1);

        req.onupgradeneeded = (event) => {
            const db = event.target.result;
            const tx = event.target.transaction;

            Object.keys(dbData).forEach((key) => {
                const table = dbData[key];
                if (!Array.isArray(table) || table.length == 0) return;
                const rows = Object.keys(table[0]);
                let store = db.createObjectStore(key, { keyPath: rows[0] });
                rows.slice(1).forEach((row) => {
                    store.createIndex(row, row, { unique: false });
                });

                store = tx.objectStore(key);
                table.forEach((item) => {
                    store.add(item);
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
    }

    getData() {
        return fetch("../../db.json")
            .then((res) => res.json())
            .then((json) => json)
            .catch((err) => {
                console.error(err);
                return null;
            });
    }

    registerAPI() {
        this.api["/api/Home/DesktopList"] = async () => {
            const db = await this.getDBInstance();
            const data = await this.getStore(db, "ACLObject", (item) => item.status == 1 && item.inDesktop == 1, {
                sortBy: "sort"
            });

            const result = data.map((item) => ({
                ...item,
                icon: !item.icon ? "https://placehold.jp/50x50.png" : `/images/Icon/${item.icon}`
            }));

            return {
                returnCode: 200,
                returnMsg: "success",
                returnData: { data: result },
                js: null
            };
        };

        this.api["/api/Music/List"] = async () => {
            const db = await this.getDBInstance();
            const data = await this.getStore(db, "Music", () => true, {
                sortBy: "sort"
            });

            const result = data.map((item) => ({
                ...item
            }));

            return {
                returnCode: 200,
                returnMsg: "success",
                returnData: { data: result },
                js: "Music"
            };
        };

    }

    async conn(url, data) {
        if (this.api[url]) {
            return await this.api[url](data);
        }

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: null,
            js: null
        }
    }

    async getDBInstance() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open("DesktopDB", 1);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (err) => reject(err);
        });
    }

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

}

export default IndexedDBOffline;