import Ajax from "./ajax.js";
import ClassRegistry from "./classRegistry.js";
import eventBus from "./eventBus.js";
import TemplateEngine from "./TemplateEngine.js";

class IframeWindow {
    constructor(set) {
        let { desktop, work } = set;
        this.currentClick;
        this.currentWindow;
        this.allWindows = [];
        this.zIndex = 1;
        this.desktop = desktop;
        this.work = work;
    }

    init(target) {
        target.onclick = (e) => {
            e.stopPropagation();
            //e.preventDefault();
            this.choose(target);
        };

        target.ondblclick = (e) => {
            e.stopPropagation();
            //e.preventDefault();
            this.currentClick.removeAttribute("class");
            this.open(target).then((windowEle) => {
                windowEle.style.zIndex = this.zIndex;
                this.zIndex += 1;

                this.applyStylesBasedOnWidth(windowEle);
                this.resizable(windowEle);
                this.closeable(windowEle);
                this.smallable(windowEle);
                this.moveable(windowEle);
                this.clickable(windowEle);

                this.go(windowEle);

                this.navSticky();
            });
        };

        this.clearChoose();
    }

    /**
     * nav置頂
     */
    navSticky() {
        this.work.closest("nav").style.zIndex = this.zIndex;
    }

    /**
     * 功能選擇
     * @param {Element} target
     */
    choose(target) {
        if (this.currentClick) {
            this.currentClick.removeAttribute("class");
            this.currentClick = null;
        }
        if (target) {
            target.className = "click";
            this.currentClick = target;
        }
    }

    /**
     * 開啟一個視窗
     * @param {Element} target
     */
    open(target) {
        //console.log(target);
        return new Promise((resolve) => {
            if (target) {
                const title = target.title;
                const iconPath = target.querySelector("[data-icon]").src;
                const data = { title, iconPath, w: target.dataset.w, h: target.dataset.h };
                Ajax.conn({
                    type: "post", url: target.dataset.href, data: { id: target.dataset.value }, fn: async (res) => {
                        if (!res) return;
                        if (res.returnCode != 200) {
                            eventBus.emit("error", JSON.stringify({ title: title, msg: res.returnMsg }));
                            return;
                        }

                        try {
                            //console.log(res);
                            const layoutHtml = await TemplateEngine.view("./templates/windowLayout.html", data);
                            const html = await TemplateEngine.view(`${target.dataset.href.replace("/api", "./templates")}.html`, res.returnData);
                            const randomId = crypto.getRandomValues(new Uint32Array(1))[0];
                            let frag = document.createRange().createContextualFragment(layoutHtml);
                            //console.log(html, frag.firstChild);
                            frag.firstChild.id = "f" + randomId;
                            frag.firstChild.style.top = 15 + Math.random() * 2 - 1 + "%";
                            frag.firstChild.style.left = 10 + Math.random() * 2 - 1 + "%";
                            if (res.js) {
                                frag.firstChild.dataset.class = res.js;
                            }
                            frag.firstChild.querySelector("main.iframe").innerHTML = html;
                            this.desktop.appendChild(frag.firstChild);

                            const windowEle = document.querySelector("#f" + randomId);
                            let frag2 = document.createRange().createContextualFragment(`<button class="working" id="f${randomId}BTN"><img src="${windowEle.querySelector(".windowIcon>img").src}" /></button>`);
                            this.work.appendChild(frag2.firstChild);
                            this.currentWindow = windowEle;
                            this.allWindows.push({
                                randomId: randomId,
                                type: target.dataset.type,
                                ele: windowEle,
                                url: target.dataset.href,
                                subEle: windowEle.querySelector(".wrap"),
                                open: true,
                                btn: document.querySelector("#f" + randomId + "BTN"),
                                history: [{ url: target.dataset.href, data: data }],
                                historyIndex: 1,
                                mainClasses: []
                            });
                            this.workingChoose("f" + randomId + "BTN");
                            this.clickBTNable(windowEle);

                            ClassRegistry.loadClass(windowEle.dataset.class).then(m => {
                                if (m) {
                                    const index = this.allWindows.findIndex(a => a.ele == windowEle);
                                    this.allWindows[index].mainClasses.push(new m(windowEle.id, res.returnData));
                                }
                            }).catch(error => eventBus.emit("error", error.message));

                            console.log(this.allWindows);

                            resolve(windowEle);
                        } catch (ex) {
                            //console.log(ex);
                        }
                    }, contentType: "application/json"
                }).catch(error => eventBus.emit("error", JSON.stringify({ title: title, msg: error.message })));
            }
        });
    }

    /** 取消所有功能選擇 */
    clearChoose() {
        document.addEventListener("click", () => {
            if (this.currentClick) {
                this.currentClick.removeAttribute("class");
                this.currentClick = null;
            }
        });
    }

    /**
     * 關閉視窗按鈕
     * @param {Element} iframe 視窗元素
     */
    closeable(iframe) {
        iframe.querySelector("#closeWindow").onclick = (e) => {
            e.stopPropagation();
            iframe.remove();
            const index = this.allWindows.findIndex(a => a.ele == iframe);
            this.allWindows[index].btn.remove();
            this.allWindows[index].mainClasses.forEach(a => {
                if (a?.destroy) {
                    a.destroy();
                }
                a = null;
            });
            this.allWindows.splice(index, 1);
            this.zIndex = (this.allWindows.length > 0) ? Math.max(...this.allWindows.map(a => a.ele.style.zIndex * 1)) + 1 : 1;
        };
    }

    /**
     * 縮小視窗按鈕
     * @param {Element} iframe 視窗元素
     */
    smallable(iframe) {
        iframe.querySelector("#smallWindow").onclick = (e) => {
            e.stopPropagation();
            if (this.currentWindow != iframe) {
                this.currentWindow = iframe;
                iframe.style.zIndex = this.zIndex;
                this.zIndex += 1;
            }

            const w = this.allWindows.find(a => a.ele == iframe);
            if (w) {
                w.btn.removeAttribute("style");
                w.open = false;
            }
            iframe.classList.toggle("closed");

            this.navSticky();
        };
    }

    /**
     * 工作列視窗按鈕點擊
     * @param {Element} iframe 視窗元素
     */
    clickBTNable(iframe) {
        document.querySelector("#" + iframe.id + "BTN").onclick = (e) => {
            e.stopPropagation();
            if (this.currentWindow != iframe && !iframe.classList.contains("closed")) {
                this.currentWindow = iframe;
                iframe.style.zIndex = this.zIndex;
                this.zIndex += 1;

                this.workingChoose(iframe.id + "BTN");
            } else {
                iframe.classList.toggle("closed");
                if (iframe.classList.contains("closed")) {
                    this.currentWindow = null;
                    this.workingChoose("");
                } else {
                    if (this.currentWindow != iframe) {
                        this.currentWindow = iframe;
                        iframe.style.zIndex = this.zIndex;
                        this.zIndex += 1;

                    }

                    this.workingChoose(iframe.id + "BTN");
                }
            }

            this.navSticky();
        };
    }

    /**
     * 視窗拖曳
     * @param {Element} iframe 視窗元素
     */
    moveable(iframe) {
        const that = this;
        let isClick = true;
        let boxLeft = 0;
        let boxTop = 0;

        iframe.querySelector("header>div.title").addEventListener("mousedown",
            function (e) {
                if (isClick && that.currentWindow != iframe) {
                    that.currentWindow = iframe;
                    iframe.style.zIndex = that.zIndex;
                    that.zIndex++;
                    isClick = false;

                    that.workingChoose(iframe.id + "BTN");
                }

                boxLeft = e.clientX - this.parentNode.getBoundingClientRect().left;
                boxTop = e.clientY - this.parentNode.getBoundingClientRect().top;

                window.addEventListener("mousemove", move);
                window.addEventListener("mouseup", stopMove);

                that.navSticky();
            });

        function move(e) {
            iframe.style.top = e.clientY - boxTop + "px";
            iframe.style.left = e.clientX - boxLeft + "px";
        }

        function stopMove() {
            window.removeEventListener("mousemove", move);
            isClick = true;
        }
    }

    /**
     * 視窗點擊
     * @param {Element} iframe 視窗元素
     */
    clickable(iframe) {
        iframe.querySelector("main").addEventListener("click", () => {
            if (this.currentWindow != iframe) {
                this.currentWindow = iframe;
                iframe.style.zIndex = this.zIndex;
                this.zIndex += 1;

                this.workingChoose(iframe.id + "BTN");
            }
        });
    }

    /**
     * 跳轉頁面
     * @param {Element} iframe 視窗元素
     */
    go(iframe) {
        const obj = this.allWindows.find(a => a.ele == iframe);
        if (!obj.subEle) return;
        const mainEle = obj.ele.querySelector("main.iframe");
        obj.subEle.onclick = (e) => this.handleEvent(e, mainEle, obj);
        obj.subEle.ondblclick = (e) => this.handleEvent(e, mainEle, obj);
        this.applyStylesBasedOnWidth(obj.ele);
        //console.log(obj, iframe);
    }

    /**
     * 跳轉頁面事件
     * @param {Object} e 事件
     * @param {Element} mainEle 視窗主要內容元素
     * @param {Element} obj 視窗元素
     */
    handleEvent(e, mainEle, obj) {
        const item = e.target.closest(".click");
        if (!item) return;
        e.stopPropagation();
        //e.preventDefault();
        switch (e.type) {
            case "click":
                if (item.dataset.click == "1") {
                    this.handleClick(item, mainEle, obj);
                }
                break;
            case "dblclick":
                if (item.dataset.click == "2") {
                    this.handleClick(item, mainEle, obj);
                }
                break;
        }
    }

    /**
     * 跳轉頁面點擊
     * @param {Element} item 功能按鈕元素
     * @param {Element} mainEle 視窗主要內容元素
     * @param {Element} obj 視窗元素
     */
    handleClick(item, mainEle, obj) {
        if (obj.type != item.dataset.type) {
            this.open(item).then((windowEle) => {
                windowEle.style.zIndex = this.zIndex;
                this.zIndex += 1;

                this.applyStylesBasedOnWidth(windowEle);
                this.resizable(windowEle);
                this.closeable(windowEle);
                this.smallable(windowEle);
                this.moveable(windowEle);
                this.clickable(windowEle);

                this.go(windowEle);

                this.navSticky();
            });
            return;
        }

        const data = { id: item.dataset.value || null };
        //console.log(item, mainEle, obj);
        Ajax.conn({
            type: "post", url: item.dataset.href, data: data, fn: async (res) => {
                if (!res) return;
                if (res.returnCode != 200) {
                    eventBus.emit("error", JSON.stringify({ title: item.title, msg: res.returnMsg }));
                    return;
                }
                //console.log(res)
                const html = await TemplateEngine.view(`${item.dataset.href.replace("/api", "./templates")}.html`, res.returnData);
                const headerEle = obj.ele.querySelector("header>.title h4");
                const windowIconEle = obj.ele.querySelector("header>.windowIcon");
                windowIconEle.innerHTML = item.querySelector("[data-icon]").outerHTML
                headerEle.innerText = item.title;
                mainEle.innerHTML = html;
                obj.url = item.dataset.href;
                obj.historyIndex += 1;
                if (obj.historyIndex != obj.history.length + 1) {
                    obj.history.splice(obj.historyIndex - 1);
                }
                obj.history.push({ url: item.dataset.href, data: data });
                obj.subEle = obj.ele.querySelector(".wrap");

                this.go(obj.ele);
            }, contentType: "application/json"
        }).catch(error => eventBus.emit("error", JSON.stringify({ title: item.title, msg: error.message })));
    }

    /**
     * 工作列視窗按鈕選擇
     * @param {string} id 當前視窗按鈕id
     */
    workingChoose(id) {
        this.allWindows.forEach(a => {
            if (a.btn.id != id) {
                a.btn.removeAttribute("style");
                a.open = false;
            } else {
                a.btn.style = "--c:#11f3c9";
                a.open = true;
            }
        });
    }

    /**
     * 內容RWD
     * @param {Element} iframe 視窗元素
     */
    applyStylesBasedOnWidth(iframe) {
        //console.log(iframe.offsetWidth)
        let w;
        if (iframe.offsetWidth <= 1200 && iframe.offsetWidth > 1000) {
            w = "25%";
        } else if (iframe.offsetWidth <= 1000 && iframe.offsetWidth > 800) {
            w = "33.333333%";
        } else if (iframe.offsetWidth <= 800 && iframe.offsetWidth > 500) {
            w = "50%";
        } else if (iframe.offsetWidth <= 500) {
            w = "100%";
        } else {
            w = "20%";
        }
        if (w) {
            iframe.querySelectorAll(".function").forEach(ele => {
                ele.style.width = w;
            });
        }
    }

    /**
     * 視窗改變大小
     * @param {Element} iframe 視窗元素
     */
    resizable(iframe) {
        const that = this;
        const resizers = iframe.querySelectorAll(".resizer");
        const minimumSize = 350;
        let originalW = 0;
        let originalH = 0;
        let originalX = 0;
        let originalY = 0;
        let originalMouseX = 0;
        let originalMouseY = 0;

        for (let i = 0; i < resizers.length; i++) {
            const currentResizer = resizers[i];
            currentResizer.addEventListener("mousedown", function (e) {
                e.preventDefault();
                originalW = parseFloat(getComputedStyle(iframe).getPropertyValue("width").replace("px", ""));
                originalH = parseFloat(getComputedStyle(iframe).getPropertyValue("height").replace("px", ""));
                originalX = iframe.getBoundingClientRect().left;
                originalY = iframe.getBoundingClientRect().top;
                originalMouseX = e.pageX;
                originalMouseY = e.pageY;
                window.addEventListener("mousemove", resize);
                window.addEventListener("mouseup", stopResize);
            });

            function resize(e) {
                if (currentResizer.classList.contains("bottomRight")) {
                    const width = originalW + (e.pageX - originalMouseX);
                    const height = originalH + (e.pageY - originalMouseY);
                    if (width > minimumSize) {
                        iframe.style.width = width + "px";
                    }
                    if (height > minimumSize) {
                        iframe.style.height = height + "px";
                    }
                } else if (currentResizer.classList.contains("bottomLeft")) {
                    const width = originalW - (e.pageX - originalMouseX);
                    const height = originalH + (e.pageY - originalMouseY);
                    if (width > minimumSize) {
                        iframe.style.width = width + "px";
                        iframe.style.left = originalX + (e.pageX - originalMouseX) + 'px'
                    }
                    if (height > minimumSize) {
                        iframe.style.height = height + "px";
                    }
                } else if (currentResizer.classList.contains("topRight")) {
                    const width = originalW + (e.pageX - originalMouseX);
                    const height = originalH - (e.pageY - originalMouseY);
                    if (width > minimumSize) {
                        iframe.style.width = width + "px";
                    }
                    if (height > minimumSize) {
                        iframe.style.height = height + "px";
                        iframe.style.top = originalY + (e.pageY - originalMouseY) + 'px'
                    }
                } else if (currentResizer.classList.contains("topLeft")) {
                    const width = originalW - (e.pageX - originalMouseX);
                    const height = originalH - (e.pageY - originalMouseY);
                    if (width > minimumSize) {
                        iframe.style.width = width + "px";
                        iframe.style.left = originalX + (e.pageX - originalMouseX) + 'px'
                    }
                    if (height > minimumSize) {
                        iframe.style.height = height + "px";
                        iframe.style.top = originalY + (e.pageY - originalMouseY) + 'px'
                    }
                }

                that.applyStylesBasedOnWidth(iframe);
            }

            function stopResize() {
                window.removeEventListener("mousemove", resize);
            }

        }
    }

}

export default IframeWindow;