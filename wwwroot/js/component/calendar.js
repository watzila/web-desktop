(function () {
    "use strict";
    /**
     * 月曆
     * @method Calendar
     * @constructs
     * @param{{yearText:Element,monthText:Element,dateBody:Element,previousBTN:Element,nextBTN:Element,updateStatus?:function}} obj {yearText:年元素,monthText:月元素,dateBody:放置日期元素,previousBTN:上個月按鈕元素,nextBTN:下個月按鈕元素,updateStatus?:日期更新後執行的函式}
     */
    var Calendar = function (obj) {
        if (obj == undefined) return;
        if (!(this instanceof Calendar)) return new Calendar(obj);

        var monthName = [
            "一月",
            "二月",
            "三月",
            "四月",
            "五月",
            "六月",
            "七月",
            "八月",
            "九月",
            "十月",
            "十一月",
            "十二月"
        ];
        var today = new Date(); //今天
        var d = new Date(today.getFullYear(), today.getMonth(), 1); //切換用
        var y = 0; //年
        var m = 0; //月
        var currentY = document.querySelector(obj.yearText) || document; //年元素
        var currentM = document.querySelector(obj.monthText) || document; //月元素
        var dateBody = document.querySelector(obj.dateBody) || document; //日期父元素
        var previousBTN = document.querySelector(obj.previousBTN) || document; //上一個按鈕元素
        var nextBTN = document.querySelector(obj.nextBTN) || document; //下一個按鈕元素
        var updateStatus = obj.updateStatus || function () { }; //日曆更新後須執行的函式
        var dateBTNs = null; //日期按鈕

        /**
         * 初始化
         * @method init
         */
        function init() {
            y = d.getFullYear();
            m = d.getMonth();

            if (currentY !== document) {
                currentY.innerText = y;
            }
            if (currentM !== document) {
                currentM.innerText = monthName[m];
            }
            createDate();
        }

        /**
         * 創建日期
         * @method createDate
         */
        function createDate() {
            if (dateBody === document) return;
            dateBody.innerHTML = "";
            var firstDay = new Date(y, m, 1).getDay();
            var lastDate = new Date(y, m + 1, 0).getDate();
            var date = 1;

            for (var i = 0; i < 42; i += 7) {
                var trEle = document.createElement("tr");
                trEle.className = "oneWeek";
                for (var j = 0; j < 7; j++) {
                    if (date > lastDate) {
                        trEle.innerHTML +=
                            "<td><button></button></td>";
                    } else if (j < firstDay && i === 0) {
                        trEle.innerHTML +=
                            "<td><button></button></td>";
                    } else {
                        if (
                            date === today.getDate() &&
                            y === today.getFullYear() &&
                            m === today.getMonth()
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
                dateBody.append(trEle);
            }
            dateBTNs = dateBody.querySelectorAll(".oneWeek>td>button");
            setTimeout(function () {
                updateStatus();
            }, 0);
        }

        /**
         * 下個月按鈕事件
         * @method nextMonth
         * @event
         */
        function nextMonth() {
            d.setMonth(m + 1);
            init();
        }

        /**
         * 上個月按鈕事件
         * @method previousMonth
         * @event
         */
        function previousMonth() {
            d.setMonth(m - 1);
            init();
        }

        /**
         * 加入按鈕事件
         * @method addEvent
         */
        function addEvent() {
            if (previousBTN !== document) {
                previousBTN.onclick = previousMonth;
            }
            if (nextBTN !== document) {
                nextBTN.onclick = nextMonth;
            }
            if (currentY !== document) {
                currentY.ondblclick = function () {
                    this.innerHTML = "<input type='text' placeholder='2021'/>";
                    this.children[0].focus();

                    this.children[0].onblur = function () {
                        if (
                            this.value == "" ||
                            isNaN(Number(this.value)) ||
                            this.value < "1900"
                        ) {
                            this.value = y;
                        }
                        d.setFullYear(this.value);
                        init();
                    };
                };
            }
        }

        init();
        addEvent();

        return {
            y: y,
            m: m,
            dateBTNs: dateBTNs
        };
    };

    window.Calendar = Calendar;
})();
