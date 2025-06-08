import BaseComponent from "./BaseComponent.js";
//import eventBus from "./component/eventBus.js";

class Calendar extends BaseComponent {
  constructor(id, model) {
    super(id);
    this.monthName = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    this.today = new Date(); //今天
    this.d = new Date(this.today.getFullYear(), this.today.getMonth(), 1); //切換用
    this.y = 0; //年
    this.m = 0; //月
    this.currentY = this.iframe.querySelector("#year") || null; //年元素
    this.currentM = this.iframe.querySelector("#month") || null; //月元素
    this.dateBody = this.iframe.querySelector("#date") || null; //日期父元素
    this.previousBTN = this.iframe.querySelector("#previous") || null; //上一個按鈕元素
    this.nextBTN = this.iframe.querySelector("#next") || null; //下一個按鈕元素
    this.dateBTNs = null; //日期按鈕

    this.init();
    this.addEvent();
  }

  init() {
    this.y = this.d.getFullYear();
    this.m = this.d.getMonth();

    if (this.currentY !== null) {
      this.currentY.innerText = this.y;
    }
    if (this.currentM !== null) {
      this.currentM.innerText = this.monthName[this.m];
    }

    this.createDate();
  }

  /**
   * 創建日期
   * @method createDate
   */
  createDate() {
    if (this.dateBody === null) return;
    this.dateBody.innerHTML = "";
    let firstDay = new Date(this.y, this.m, 1).getDay();
    let lastDate = new Date(this.y, this.m + 1, 0).getDate();
    let date = 1;

    for (let i = 0; i < 42; i += 7) {
      let trEle = document.createElement("tr");
      trEle.className = "oneWeek";
      for (let j = 0; j < 7; j++) {
        if (date > lastDate) {
          trEle.innerHTML +=
            "<td><button></button></td>";
        } else if (j < firstDay && i === 0) {
          trEle.innerHTML +=
            "<td><button></button></td>";
        } else {
          if (
            date === this.today.getDate() &&
            this.y === this.today.getFullYear() &&
            this.m === this.today.getMonth()
          ) {
            trEle.innerHTML +=
              "<td style='--i:" +
              date * 0.02 +
              "s'><button class='active'>" +
              date++ +
              "</button></td>";
          } else {
            trEle.innerHTML +=
              "<td style='--i:" +
              date * 0.02 +
              "s'><button>" +
              date++ +
              "</button></td>";
          }
        }
      }
      this.dateBody.append(trEle);
    }
    this.dateBTNs = this.dateBody.querySelectorAll(".oneWeek>td>button");
  }

  /**
   * 下個月按鈕事件
   * @method nextMonth
   * @event
   */
  nextMonth() {
    this.d.setMonth(this.m + 1);
    this.init();
  }

  /**
   * 上個月按鈕事件
   * @method previousMonth
   * @event
   */
  previousMonth() {
    this.d.setMonth(this.m - 1);
    this.init();
  }

  /**
   * 加入按鈕事件
   * @method addEvent
   */
  addEvent() {
    if (this.previousBTN !== null) {
      this.setEvent(this.previousBTN, "click", this.previousMonth.bind(this));
    }
    if (this.nextBTN !== null) {
      this.setEvent(this.nextBTN, "click", this.nextMonth.bind(this));
    }
    if (this.currentY !== null) {
      const that = this;
      this.currentY.ondblclick = function () {
        this.innerHTML = "<input type='text' placeholder='2021' type='number'/>";
        this.children[0].focus();

        this.children[0].onblur = function () {
          if (
            this.value == "" ||
            isNaN(Number(this.value)) ||
            this.value < "1900"
          ) {
            this.value = that.y;
          }
          that.d.setFullYear(this.value);
          that.init();
        };
      };
    }
  }

}

export default Calendar;