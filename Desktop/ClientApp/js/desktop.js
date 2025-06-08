import Notification from "./component/notification.js";
import IframeWindow from "./component/iframeWindow.js";

class Desktop {
  constructor() {
    this.desktop = document.getElementById("desktop");
    this.wraps = document.getElementsByClassName("module");
    this.dateTime = document.querySelector("#dateTime");
    this.dateTimeSpans = this.dateTime.querySelectorAll("span");
    this.notification = document.getElementById("notification");
    this.work = document.getElementById("work");
    this.calendar = document.getElementById("calendar");
    this.turnOffBTN = document.getElementById("turnOffBTN");
    this.nowDate;
    this.hr12Name;
    this.nowTime;
    this.iframeWindow = new IframeWindow({ desktop: this.desktop, work: this.work });
    this.notificationEvent = new Notification();

    this.init();
  }

  init() {
    this.setPos();
    setInterval(() => { this.updateDateTime(); }, 1000);

    this.notification.onclick = (e) => {
      e.stopPropagation();
      this.notificationEvent.clickable();
    };

    this.turnOffBTN.onclick = () => {
      this.deleteDB();
    };

    window.addEventListener("click", (e) => {
      if (!this.notificationEvent.infoWrap.contains(e.target)) {
        this.notificationEvent.infoWrap.classList.remove("notificationOpen");
      }
    });

    for (const item of this.wraps) {
      this.iframeWindow.init(item.firstElementChild);
    }

    //console.log(this.iframeWindow);
  }

  /**設定位置*/
  setPos() {
    const CELL_SIZE = 15 + 2; // cell size + gap
    const cols = Math.floor(window.innerWidth / CELL_SIZE);
    const rows = Math.floor(window.innerHeight / CELL_SIZE);
    const occupied = Array.from({ length: rows }, () => Array(cols).fill(false));

    for (const item of this.wraps) {
      let x = (item.dataset.x || 1) * 1 - 1;
      let y = (item.dataset.y || 1) * 1 - 1;
      let w = (item.dataset.w || 4) * 1;
      let h = (item.dataset.h || 4) * 1;
      if (x < 0) {
        x += cols + 2;
      }
      if (y < 0) {
        y += rows + 2;
      }
      // 如果原始位置就能放就用
      if (!isFree(x, y, w, h)) {
        let placed = false;
        for (let ny = 0; ny < rows && !placed; ny++) {
          for (let nx = 0; nx < cols && !placed; nx++) {
            if (isFree(nx, ny, w, h)) {
              x = nx;
              y = ny;
              placed = true;
            }
          }
        }
      }

      occupy(x, y, w, h);

      item.style.setProperty('--x', x + 1);
      item.style.setProperty('--y', y + 1);
      item.style.setProperty('--w', w);
      item.style.setProperty('--h', h);
    }

    function isFree(x, y, w, h) {
      if (x + w > cols || y + h > rows) return false;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          if (occupied[y + dy]?.[x + dx]) return false;
        }
      }
      return true;
    }

    function occupy(x, y, w, h) {
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          occupied[y + dy][x + dx] = true;
        }
      }
    }

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

  deleteDB() {
    indexedDB.deleteDatabase("DesktopDB").onsuccess = () => {
      this.notificationEvent.push({ title: "IndexedDB", msg: "已刪除" });
    };
  }

}

new Desktop();