import Notification from "./component/notification.js";
import IframeWindow from "./component/iframeWindow.js";
import eventBus from "./component/eventBus.js";

class Desktop {
    constructor() {
        this.desktop = document.getElementById("desktop");
        this.wraps = document.getElementsByClassName("wrap");
        this.dateTime = document.querySelector("#dateTime");
        this.dateTimeSpans = this.dateTime.querySelectorAll("span");
        this.notification = document.getElementById("notification");
        this.work = document.getElementById("work");
        this.calendar = document.getElementById("calendar");
        this.nowDate;
        this.hr12Name;
        this.nowTime;
        this.iframeWindow = new IframeWindow();
        this.notificationEvent = new Notification();
        this.calendarEvent = new Calendar({
            yearText: "#year",
            monthText: "#month",
            dateBody: "#date",
            previousBTN: "#previous",
            nextBTN: "#next"
        });

        this.init();
    }

    init() {
        setInterval(() => { this.updateDateTime(); }, 1000);

        this.notification.onclick = (e) => {
            e.stopPropagation();
            this.notificationEvent.clickable();
        };

        this.dateTime.onclick = (e) => {
            e.stopPropagation();
            this.calendar.classList.toggle("closed");
        };

        window.addEventListener("click", (e) => {
            if (!this.notificationEvent.infoWrap.contains(e.target)) {
                this.notificationEvent.infoWrap.classList.remove("notificationOpen");
            }
        });

        eventBus.on("error", (error) => {
            try {
                const info = JSON.parse(error);
                this.notificationEvent.push(info);
            } catch (ex){
                alert(ex);
            }
        });

        for (const item of this.wraps) {
            this.iframeWindow.init(item.firstElementChild, this.desktop, this.work);
        }

        console.log(this.notificationEvent);
    }

    /**更新時間 */
    updateDateTime() {
        const newDate = new Date();
        let year = newDate.getFullYear();
        let month = newDate.getMonth() + 1;
        let days = newDate.getDate();
        let hour = newDate.getHours();
        let mins = newDate.getMinutes();
        let nowDate = year + "/" + month.toString().padStart(2, "0") + "/" + days.toString().padStart(2, "0");
        let hr12Name = hour > 12 ? "下午" : "上午";
        let nowTime = (hour > 12 ? hour - 12 : hour).toString().padStart(2, "0") + ":" + mins.toString().padStart(2, "0");

        if (this.hr12Name != hr12Name) {
            this.dateTimeSpans[0].querySelector("i").innerText = this.hr12Name = hr12Name;
        }
        if (this.nowTime != nowTime) {
            this.dateTimeSpans[0].querySelector("time").innerText = this.nowTime = nowTime;
        }
        if (this.nowDate != nowDate) {
            this.dateTimeSpans[1].innerText = this.nowDate = nowDate;
        }
    }



}

new Desktop();