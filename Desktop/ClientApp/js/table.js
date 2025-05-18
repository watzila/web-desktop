import BaseComponent from "./BaseComponent.js";

class Table extends BaseComponent {
    constructor(id, model) {
        super(id);
        this.tableEle = this.iframe.querySelector(".table");
        this.resizerEles = this.iframe.querySelectorAll(".colResizer");
        this.colEles = this.iframe.querySelectorAll("colgroup col");
        this.trEles = this.iframe.querySelectorAll(".tbody>tr");
        this.data = model.data;
        this.currentClick;

        this.init();
    }

    init() {
        this.tableResize();

        this.setEvent(this.iframe, "click", (e) => {
            e.stopPropagation();
            if (this.currentClick) {
                this.currentClick.classList.remove("click");
                this.currentClick = null;
            }
        });

        this.trEles.forEach(tr => {
            this.setEvent(tr, "click", (e) => {
                e.stopPropagation();
                this.choose(e.currentTarget);
            });
        });
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
            target.className = "click";
            this.currentClick = target;
        }
    }

    /**表格調整大小*/
    tableResize() {
        this.resizerEles.forEach((resizer, i) => {
            const col = this.iframe.querySelector(`colgroup col:nth-child(${i + 1})`);

            this.setEvent(resizer, "mousedown", (e) => {
                e.stopPropagation();
                let startX = e.pageX;
                let startWidth = col.offsetWidth;

                document.body.style.cursor = "col-resize";

                const onMouseMove = (e) => {
                    e.stopPropagation();
                    let newWidth = Math.max(50, startWidth + (e.pageX - startX));
                    this.updateWidth(col, newWidth);
                };

                const onMouseUp = () => {
                    e.stopPropagation();
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);

                    document.body.removeAttribute("style");
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);

            });
        });
    }

    /**
     * 更新寬度
     * @param {HTMLElement} col 欄位元素
     * @param {number} newWidth 新寬度
     */
    updateWidth(col, newWidth) {
        const w = [...(this.colEles)].map(c => {
            if (c == col) {
                return newWidth;
            } else {
                return getComputedStyle(c).getPropertyValue("width").replace("px", "") * 1;
            }
        });

        this.tableEle.style.width = w.reduce((acc, cur) => acc + cur, 0) + "px";
        col.style.width = `${newWidth}px`;
    }

}

export default Table;