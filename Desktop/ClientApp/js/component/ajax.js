import IndexedDBOffline from "./indexedDBOffline.js";
/**ajax連線 */
class Ajax {
    static enableOffline = true;
    static db = null;

    static async init() {
        if (this.enableOffline && !this.db) {
            this.db = new IndexedDBOffline();
            await this.db.ready;
        }
    }
    /**
     * 連線
     * @param {{type:string,url:string,data?:object,fn?:Function,contentType?:string}} set {type:連線類型,url:連線地址,data?:要傳送的物件,fn?:接收資料後要執行的函式,contentType?:資源的media type}
     */
    static async conn(set) {
        let { type, url, data, fn, contentType } = set;
        if (typeof fn !== "function") {
            fn = () => { };
        }
        //console.log(set);

        if (this.enableOffline && /^\/api\/.*/.test(url)) {
            if (!this.db) await this.init();
            const result = await this.db.conn(url, data);
            //console.log(result);
            fn(result);
            return;
        }

        const options = {
            method: type,
            redirect: "follow"
        };
        if (contentType) {
            options.headers = {};
            options.headers["Content-Type"] = contentType;
        }
        if (type == "post" && data) {
            if (data instanceof FormData) {
                options.body = data;
            } else {
                options.body = JSON.stringify(data);
            }
        } else if (type == "get" && data) {
            url = encodeURI(url + "?" + Object.keys(data).map(k => k + "=" + data[k]).join("&"));
        }

        return fetch(url, options)
            .then(response => {
                //console.log(response);
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("✖找不到此頁面");
                }
            })
            .then(result => fn(result));
    }
}

export default Ajax;