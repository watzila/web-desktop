/**ajax連線 */
class Ajax {
    /**
     * 連線
     * @param {{type:string,url:string,data?:object,fn?:Function,contentType?:string}} set {type:連線類型,url:連線地址,data?:要傳送的物件,fn?:接收資料後要執行的函式,contentType?:資源的media type}
     */
    static conn(set) {
        let { type, url, data, fn, contentType } = set;
        if (typeof fn !== "function") {
            fn = () => { };
        }
        //console.log(set);
        const options = {
            method: type,
            redirect: "follow",
            headers: {
                //"X-Requested-With": "XMLHttpRequest"
            }
        };
        if (contentType) {
            options.headers["Content-Type"] = contentType;
        }
        if (type !== "get" && data) {
            options.body = JSON.stringify(data);
        }
       return fetch(url, options)
            .then(response => {
                //console.log(response);
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(JSON.stringify({ title: response.url, msg: "✖找不到此頁面" }));
                }
            })
            .then(result => fn(result));
    }
}

export default Ajax;