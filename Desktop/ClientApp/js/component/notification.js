import eventBus from "./eventBus.js";

class Notification {
    constructor() {
        this.infoWrap = document.getElementById("infoWrap");

        this.infoWrap.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        this.init();
    }

    init() {
        eventBus.on("info", (error) => {
            try {
                const info = JSON.parse(error);
                this.push(info);
            } catch (ex) {
                this.push({ title: "系統錯誤", msg: ex });
                //console.error(ex);
            }
        });

        eventBus.on("error", (error) => {
            try {
                const info = JSON.parse(error);
                this.push(info);
            } catch (ex) {
                this.push({ title: "", msg: error });
                //this.push({ title: "系統錯誤", msg: ex });
                //console.error(ex);
            }
        });
    }

    clickable() {
        if (infoWrap) {
            infoWrap.classList.toggle("notificationOpen");
        }
    }

    push(n) {
        const div = document.createElement("div");
        const div2 = document.createElement("div");
        div2.className = "alert";
        div.innerHTML = `<h4>${n.title}</h4><p>${n.msg}</p><div class="buttonWrap"><button onclick="this.closest('div:not(.buttonWrap)').remove()">關閉</button></div>`;
        div2.innerHTML = `<h4>${n.title}</h4><p>${n.msg}</p><div class="buttonWrap"><button onclick="this.closest('div.alert').remove()">關閉</button></div>`;
        this.infoWrap.append(div);

        document.body.append(div2);
        const div2Style = window.getComputedStyle(div2);
        let delay = div2Style.getPropertyValue("animation-delay").replaceAll("s", "").split(",").reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue), 0);
        let duration = div2Style.getPropertyValue("animation-duration").replaceAll("s", "").split(",").reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue), 0);
        setTimeout(() => {
            div2.remove();
        }, (delay + duration) * 1000);
    }

    clearable() {
        this.infoWrap.innerHTML = "";
    }
}

export default Notification;