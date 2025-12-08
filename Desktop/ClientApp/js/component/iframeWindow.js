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
        if (!target.dataset.click) {
            return;
        }
        target.onclick = (e) => {
            e.stopPropagation();
            //e.preventDefault();
            this.choose(target);
        };

        target.ondblclick = (e) => {
            e.stopPropagation();
            //e.preventDefault();
            this.currentClick.classList.remove("click");
            this.open(target).then((windowEle) => {
                windowEle.style.zIndex = this.zIndex;
                this.zIndex += 1;

                this.applyStylesBasedOnWidth(windowEle);
                this.resizableAndMoveable(windowEle);
                this.closeable(windowEle);
                this.bigable(windowEle);
                this.smallable(windowEle);
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
        this.work.style.zIndex = this.zIndex;
    }

    /**
     * 功能選擇
     * @param {Element} target
     */
    choose(target) {
        if (this.currentClick) {
            this.currentClick.classList.remove("click");
            this.currentClick = null;
        }
        if (target) {
            target.classList.add("click");
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
                const iconPath = target.querySelector("[data-icon]")?.src || "";
                const data = { title, iconPath, w: target.dataset.w, h: target.dataset.h };
                Ajax.conn({
                    type: "post", url: target.dataset.href, data: { id: target.dataset.value }, fn: async (res) => {
                        if (!res) return;

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
                            let frag2 = document.createRange().createContextualFragment(`<button class="noUserSelect working closed softQ" id="f${randomId}BTN" title="${title}"><img src="${windowEle.querySelector(".windowIcon>img").src}" /></button>`);
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
                this.currentClick.classList.remove("click");
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
     * 放大視窗按鈕
     * @param {Element} iframe 視窗元素
     */
    bigable(iframe) {
        iframe.querySelector("#bigWindow").onclick = (e) => {
            e.stopPropagation();
            if (this.currentWindow != iframe) {
                this.currentWindow = iframe;
                iframe.style.zIndex = this.zIndex;
                this.zIndex += 1;
            }

            iframe.classList.toggle("fillWindow");

            this.navSticky();
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
                w.btn.classList.remove("closed");
                w.open = false;
            }
            iframe.classList.add("closed");

            this.navSticky();
        };
    }

    /**
     * 工作列視窗按鈕點擊
     * @param {Element} iframe 視窗元素
     */
    clickBTNable(iframe) {
        const w = this.allWindows.find(a => a.ele == iframe);

        this.moveBTNable(w.btn);

        w.btn.onclick = (e) => {
            e.stopPropagation();
            console.log(e.currentTarget.isDragging)
            if (e.currentTarget.isDragging) {
                e.currentTarget.isDragging = false;
                return;
            }
            if (this.currentWindow != iframe && !iframe.classList.contains("closed")) {
                this.currentWindow = iframe;
                iframe.style.zIndex = this.zIndex;
                this.zIndex += 1;
            } else {
                iframe.classList.remove("closed");
                if (this.currentWindow != iframe) {
                    this.currentWindow = iframe;
                    iframe.style.zIndex = this.zIndex;
                    this.zIndex += 1;

                }
                w.open = true;
                e.currentTarget.classList.add("closed");
            }

            this.navSticky();
        };
    }

    /**
     * 工作列視窗按鈕拖曳
     * @param {Element} ele 工作列視窗按鈕元素
     */
    moveBTNable(ele) {
        const that = this;
        let isClick = true;
        let offsetX = 0;
        let offsetY = 0;
        let startX = 0;
        let startY = 0;

        ele.onmousedown = function (e) {
            if (isClick) {
                isClick = false;
                this.classList.remove("softQ");
            }

            const rect = this.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            startX = e.clientX;
            startY = e.clientY;
            ele.isDragging = false;

            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", stopMove);
        };

        function move(e) {
            let deltaX = e.clientX - startX;
            let deltaY = e.clientY - startY;
            let distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

            if (distance > 10) {
                ele.isDragging = true;
            }

            ele.style.top = e.clientY - offsetY + "px";
            ele.style.left = e.clientX - offsetX + "px";
        }

        function stopMove() {
            isClick = true;
            that.adsorption(ele);
            ele.classList.add("softQ");
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", stopMove);
        }
    }

    /**
     * 工作列視窗按鈕自動吸附到最近邊緣
     * @param {Element} ele 工作列視窗按鈕元素
     */
    adsorption(ele) {
        const { innerWidth, innerHeight } = window;
        const rect = ele.getBoundingClientRect();

        const toLeft = rect.left;
        const toRight = innerWidth - rect.right;
        const toTop = rect.top;
        const toBottom = innerHeight - rect.bottom;

        const minH = Math.min(toLeft, toRight);
        const minV = Math.min(toTop, toBottom);

        let finalLeft = rect.left;
        let finalTop = rect.top;

        if (minH < minV) {
            // 吸附左或右
            finalLeft = toLeft < toRight ? 0 : innerWidth - rect.width;
        } else {
            // 吸附上或下
            finalTop = toTop < toBottom ? 0 : innerHeight - rect.height;
        }

        // 設定位置（使用 style，保留動畫）
        ele.style.left = `${finalLeft}px`;
        ele.style.top = `${finalTop}px`;
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
                this.resizableAndMoveable(windowEle);
                this.closeable(windowEle);
                this.bigable(windowEle);
                this.smallable(windowEle);
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
     * 視窗改變大小、拖曳
     * @param {Element} iframe 視窗元素
     */
    resizableAndMoveable(iframe) {
        const that = this;
        const minimumSize = 350;
        const MARGINS = 15; // 邊緣偵測範圍

        let clicked = null;
        let onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;
        let b, x, y, e;
        let redraw = false;
        let isClick = true;

        // 計算滑鼠位置和邊緣狀態
        function calc(event) {
            b = iframe.getBoundingClientRect();
            x = event.clientX - b.left;
            y = event.clientY - b.top;

            onTopEdge = y < MARGINS;
            onLeftEdge = x < MARGINS;
            onRightEdge = x >= b.width - MARGINS;
            onBottomEdge = y >= b.height - MARGINS;
        }

        // 判斷是否可以移動（在標題列區域）
        function canMove(event) {
            const header = iframe.querySelector("header>div.title");
            if (!header) return false;

            const headerRect = header.getBoundingClientRect();
            return event.clientX >= headerRect.left &&
                event.clientX <= headerRect.right &&
                event.clientY >= headerRect.top &&
                event.clientY <= headerRect.bottom;
        }

        // 滑鼠按下
        function onMouseDown(event) {
            event.preventDefault();
            if (that.currentWindow.classList.contains("fillWindow")) return;
            calc(event);

            const isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;
            const isMoving = !isResizing && canMove(event);

            // 如果既不是 resize 也不是 move，就不處理
            if (!isResizing && !isMoving) return;

            // 切換視窗焦點（只在移動時）
            if (isMoving && isClick && that.currentWindow != iframe) {
                that.currentWindow = iframe;
                iframe.style.zIndex = that.zIndex;
                that.zIndex++;
                isClick = false;
            }

            clicked = {
                cx: event.clientX,
                cy: event.clientY,
                x: x,
                y: y,
                w: b.width,
                h: b.height,
                isResizing: isResizing,
                isMoving: isMoving,
                onTopEdge: onTopEdge,
                onLeftEdge: onLeftEdge,
                onRightEdge: onRightEdge,
                onBottomEdge: onBottomEdge
            };

            if (isMoving) {
                iframe.classList.add("dragging");
                that.navSticky();
            }
        }

        // 滑鼠移動
        function onMouseMove(event) {
            calc(event);
            e = event;
            redraw = true;
        }

        // 滑鼠放開
        function onMouseUp(event) {
            if (clicked && clicked.isMoving) {
                isClick = true;
                iframe.classList.remove("dragging");
            }
            clicked = null;
        }

        // 動畫循環
        function animate() {
            requestAnimationFrame(animate);

            if (!redraw) return;
            redraw = false;

            // Resize 邏輯
            if (clicked && clicked.isResizing) {

                // 右邊緣
                if (clicked.onRightEdge) {
                    const width = Math.max(x, minimumSize);
                    iframe.style.width = width + 'px';
                }

                // 下邊緣
                if (clicked.onBottomEdge) {
                    const height = Math.max(y, minimumSize);
                    iframe.style.height = height + 'px';
                }

                // 左邊緣
                if (clicked.onLeftEdge) {
                    const width = Math.max(clicked.cx - e.clientX + clicked.w, minimumSize);
                    if (width > minimumSize) {
                        iframe.style.width = width + 'px';
                        iframe.style.left = e.clientX + 'px';
                    }
                }

                // 上邊緣
                if (clicked.onTopEdge) {
                    const height = Math.max(clicked.cy - e.clientY + clicked.h, minimumSize);
                    if (height > minimumSize) {
                        iframe.style.height = height + 'px';
                        iframe.style.top = e.clientY + 'px';
                    }
                }

                that.applyStylesBasedOnWidth(iframe);
                return;
            }

            // Move 邏輯
            if (clicked && clicked.isMoving) {
                iframe.style.top = (e.clientY - clicked.y) + 'px';
                iframe.style.left = (e.clientX - clicked.x) + 'px';
                return;
            }

            // 游標樣式（沒有按下滑鼠時）
            if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
                iframe.style.cursor = 'nwse-resize';
            } else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
                iframe.style.cursor = 'nesw-resize';
            } else if (onRightEdge || onLeftEdge) {
                iframe.style.cursor = 'ew-resize';
            } else if (onBottomEdge || onTopEdge) {
                iframe.style.cursor = 'ns-resize';
            } else if (canMove(e)) {
                iframe.style.cursor = 'move';
            } else {
                iframe.style.cursor = 'default';
            }
        }

        // 綁定事件
        iframe.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        // 啟動動畫循環
        animate();
    }

}

export default IframeWindow;