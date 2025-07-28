//主要
; (function () {
    "use strict";
    const NewChart = function ({ canvas, type = "bar", title, equal = 5, axis, remarkOffset = 15, maxWidth = 0, maxHeight = 0, data = [] } = {}) {
        if (!(this instanceof NewChart)) return new NewChart({ canvas, type, title, equal, axis, remarkOffset, maxWidth, maxHeight, data });
        const n = this;
        const parser = new DOMParser();
        n.canvas = document.getElementById(canvas) || null;
        if (n.canvas === null) return;
        n.equal = equal;//軸等分
        n.title = title;
        n.svg = null;
        n.canvasData = {
            randomId: crypto.getRandomValues(new Uint32Array(1))[0],
            marginT: 70,
            marginR: 15,
            notesYPos: 20,
            width: parseFloat(getComputedStyle(n.canvas).width),//畫布寬
            height: parseFloat(getComputedStyle(n.canvas).height),//畫布高
            yAxisTextLong: 0,//Y軸文字寬
            xAxisTextLong: 0,//X軸文字一格寬
            type: type.replace(" ", "").toLowerCase(),
            axis: axis,
            remarkOffset: remarkOffset,
            data: data,//圖表資料
            ratio: 0,//軸等分比率
            mergeData: null
        };

        n.mergeChart = function (opt) {
            if (opt && opt.type != "pie") {
                n.canvasData.marginT += 20;
                let values = n._getValues(opt.type, opt.data);
                n.canvasData.mergeData = {
                    type: opt.type,
                    axis: opt.axis,
                    remarkOffset: opt.remarkOffset,
                    notesYPos: n.canvasData.notesYPos + 25,
                    data: opt.data,
                    ratio: n._ratioValue(values, n.equal)
                };

                n.canvas.innerHTML = "";
                n._init();
                n._mergeInit();
            }
        };

        n._awake = function () {
            let values = n._getValues(n.canvasData.type, n.canvasData.data);
            n.canvasData.ratio = n._ratioValue(values, n.equal);
        };

        n._init = function () {
            const newSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            if (maxWidth > 0 && maxWidth < n.canvasData.width) {
                n.canvasData.width = maxWidth;
            }
            if (n.canvasData.height > 0) {
                if (maxHeight > 0 && maxHeight < n.canvasData.height) {
                    n.canvasData.height = maxHeight;
                }
            } else {
                n.canvasData.height = maxHeight;
            }
            newSVG.setAttribute("width", n.canvasData.width);
            newSVG.setAttribute("height", n.canvasData.height);
            newSVG.setAttribute("id", `chartSVG${n.canvasData.randomId}`);
            n.canvasData.xAxisLong = n.canvasData.width * 0.8;//X軸長
            n.canvasData.yAxisLong = n.canvasData.height * 0.6;//Y軸長
            if (n.canvasData.type != "pie") {
                if (!n.canvasData.axis.x.categories || n.canvasData.axis.x.categories.length === 0) {
                    return;
                }
                n.canvasData.xAxisTextLong = n._fixedNum(n.canvasData.xAxisLong / n.canvasData.axis.x.categories.length);
                n.canvasData.yAxisTextLong = n.canvasData.axis.x.isTable ? 50 : n.canvasData.width * 0.05;
                n.canvas.append(newSVG);
                n.svg = document.getElementById(`chartSVG${n.canvasData.randomId}`);

                n._drawChart(n.canvasData.type, n.canvasData.ratio, n.canvasData.notesYPos, n.canvasData.data);
                newSVG.appendChild(n._drawXAxis());
                if (n.canvasData.axis.x.isSubline) {
                    newSVG.insertBefore(n._drawXSubAxis(), newSVG.children[0]);
                }
                if (n.canvasData.axis.x.isTable) {
                    newSVG.appendChild(n._drawXAxisTable());
                    n._xAxisTableHeight();
                } else {
                    newSVG.appendChild(n._drawXAxisText());
                }
                newSVG.appendChild(n._drawYAxisText(n.canvasData.axis.y, n.canvasData.ratio));
                n._xAxisTextRotate();
            } else {
                n.canvas.append(newSVG);
                n.svg = document.getElementById(`chartSVG${n.canvasData.randomId}`);

                n._drawChart(n.canvasData.type, n.canvasData.ratio, n.canvasData.notesYPos, n.canvasData.data);
            }

        };

        n._mergeInit = function () {
            n.svg.appendChild(n._drawYAxisText(n.canvasData.mergeData.axis.y, n.canvasData.mergeData.ratio));
            n._drawChart(n.canvasData.mergeData.type, n.canvasData.mergeData.ratio, n.canvasData.mergeData.notesYPos, n.canvasData.mergeData.data, true);
        };

        /**
         * 取值
         * @param {String} type 圖表類型
         * @param {object} data 圖表資料
         * */
        n._getValues = function (type, data) {
            let values = [];
            if (type == "mergebar") {
                values = data.reduce((acc, obj) => {
                    obj.value.forEach((val, index) => {
                        acc[index] = acc[index] ? acc[index] + val * 1 : val * 1;
                    });
                    return acc;
                }, []);
            } else {
                values = values.concat(data.map(a => a.value).flat());
            }
            return values;
        };

        /**
         * 畫圖表
         * @param {String} type 圖表類型
         * @param {Number} ratio 軸等分比率
         * @param {Number} notesYPos 分類註釋上下位置
         * @param {object} data 圖表資料
         * @param {boolean} isMerge 是否要合併的
         * */
        n._drawChart = function (type, ratio, notesYPos, data, isMerge = false) {
            let chart;
            switch (type) {
                case "bar":
                    chart = new BarChart(n.svg, n.canvasData, isMerge, data);
                    break;

                case "line":
                    chart = new LineChart(n.svg, n.canvasData, isMerge, data);
                    break;

                case "pie":
                    chart = new PieChart(n.svg, n.canvasData, data);
                    break;

                case "mergebar":
                    chart = new MergeBarChart(n.svg, n.canvasData, isMerge, data);
                    break;

                default:
                    return;
            }

            if (chart) {
                if (typeof chart.drawNotes === 'function') {
                    chart.drawNotes(notesYPos);
                    n._notesOffset(type);
                }
                //n._drawTitle(chart);
                if (typeof chart.drawValue === 'function') {
                    chart.drawValue(n._drawRemark, n.equal, ratio);
                }
            }
            //console.log(n.canvasData);
        };

        //畫X軸
        n._drawXAxis = function () {
            let axis = `<g xmlns="http://www.w3.org/2000/svg" transform="translate(${n.canvasData.yAxisTextLong + n.canvasData.marginR},${n.canvasData.marginT})">
    <line x1="0" y1="${n.canvasData.yAxisLong}" x2="${n.canvasData.xAxisLong}" y2="${n.canvasData.yAxisLong}" stroke="${n.canvasData.axis.x.color || "black"}" ></line>
    </g>`;

            return parser.parseFromString(axis, "image/svg+xml").documentElement;
        };

        //畫X軸輔助線
        n._drawXSubAxis = function () {
            let axis = `<g xmlns="http://www.w3.org/2000/svg" transform="translate(${n.canvasData.yAxisTextLong + n.canvasData.marginR},${n.canvasData.marginT})">`;
            for (let i = 0; i <= n.equal; i++) {
                axis += `<line x1="0" y1="${n.canvasData.yAxisLong / n.equal * i}" x2="${n.canvasData.xAxisLong}" y2="${n.canvasData.yAxisLong / n.equal * i}" stroke="${n.canvasData.axis.x.subColor || "#ccc"}"></line>`;
            }
            axis += "</g>";

            return parser.parseFromString(axis, "image/svg+xml").documentElement;
        };

        /**
         * 畫Y軸字
         * @param {Object} yAxis y軸
         * @param {Number} ratio 軸等分比率
         * */
        n._drawYAxisText = function (yAxis, ratio) {
            let textAnchor = yAxis.pos === "right" ? "start" : "end";
            let yAxisText = `<g xmlns="http://www.w3.org/2000/svg" transform="translate(${yAxis.pos === "right" ? n.canvasData.xAxisLong + n.canvasData.yAxisTextLong * 1.5 : n.canvasData.yAxisTextLong},${n.canvasData.marginT})">`;
            for (let i = 0; i <= n.equal; i++) {
                // 計算實際的軸刻度值：從 axisMax 到 axisMin
                const axisValue = n.canvasData.axisMax - (i * (n.canvasData.axisMax - n.canvasData.axisMin) / n.equal);
                yAxisText += `<text dy="4" y="${n.canvasData.yAxisLong / n.equal * i}" x="0" font-size="12px" text-anchor="${textAnchor}">${n._fixedNum(axisValue, 1)}</text>`;
            }
            yAxisText += `<text y="-20" x="${(yAxis.pos === "right" ? -1 : 1) * 10}" font-size="12px" text-anchor="middle">${yAxis.unit.text}</text></g>`;

            return parser.parseFromString(yAxisText, "image/svg+xml").documentElement;
        };

        //畫X軸字
        n._drawXAxisText = function () {
            let xAxisText = `<g xmlns="http://www.w3.org/2000/svg" id="xAxisText${n.canvasData.randomId}" transform="translate(${n.canvasData.yAxisTextLong + n.canvasData.marginR + (n.canvasData.xAxisLong - n.canvasData.xAxisTextLong * (n.canvasData.axis.x.categories.length - 1)) / 2},${n.canvasData.yAxisLong + n.canvasData.marginT})">`;
            for (let i = 0; i < n.canvasData.axis.x.categories.length; i++) {
                xAxisText += `<g transform="translate(${n.canvasData.xAxisTextLong * i},0)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="${n.canvasData.axis.x.color || "black"}"></line>
      <text y="20" x="0" font-size="12px" text-anchor="middle">${n.canvasData.axis.x.categories[i]}</text>
      </g>`;
            }
            xAxisText += `<text y="20" x="${n.canvasData.xAxisLong - (n.canvasData.xAxisLong - n.canvasData.xAxisTextLong * (n.canvasData.axis.x.categories.length - 1)) / 2}" font-size="12px" text-anchor="middle">${n.canvasData.axis.x.unit.text}</text></g>`;

            return parser.parseFromString(xAxisText, "image/svg+xml").documentElement;
        };

        //x軸字太長旋轉
        n._xAxisTextRotate = function () {
            let xAxisTextEle = document.getElementById(`xAxisText${n.canvasData.randomId}`);
            if (xAxisTextEle) {
                let texts = xAxisTextEle.getElementsByTagName("text");
                Object.keys(texts).map(k => {
                    if (texts[k].getBBox().width >= n.canvasData.xAxisTextLong) {
                        texts[k].setAttribute("text-anchor", "end");
                        texts[k].setAttribute("transform", `rotate(${-45})`);
                    }
                });
            }
        };

        //畫X軸表格
        n._drawXAxisTable = function () {
            let xAxisTable = `<foreignObject xmlns="http://www.w3.org/2000/svg" width="${n.canvasData.xAxisLong + 50}" transform="translate(${n.canvasData.marginR},${n.canvasData.yAxisLong + n.canvasData.marginT + 5})">`;
            xAxisTable += `<table id="xAxisTable${n.canvasData.randomId}" xmlns="http://www.w3.org/1999/xhtml" style="font-size: 14px;text-align: center;border-collapse: collapse;">`;
            xAxisTable += "<tr>";
            for (let i = 0; i <= n.canvasData.axis.x.categories.length; i++) {
                if (i == 0) {
                    xAxisTable += `<td width="50"></td>`;
                } else {
                    xAxisTable += `<td width="${n.canvasData.xAxisTextLong}" style="padding: 3px;border: 1px solid black;">${n.canvasData.axis.x.categories[i - 1]}</td>`;
                }
            }
            xAxisTable += "</tr>";
            for (let i = 0; i < n.canvasData.data.length; i++) {
                xAxisTable += `<tr style="border: 1px solid black;">`;
                for (let j = 0; j <= n.canvasData.data[i].value.length; j++) {
                    if (j == 0) {
                        xAxisTable += `<td width="50" style=";padding: 3px;border: 1px solid black">${n.canvasData.data[i].subject}</td>`;
                    } else {
                        xAxisTable += `<td width="${n.canvasData.xAxisTextLong}" style="padding: 3px;border: 1px solid black;">${n.canvasData.data[i].value[j - 1]}</td>`;
                    }
                }
                xAxisTable += "</tr>";
            }
            xAxisTable += "</table>";

            xAxisTable += "</foreignObject>";
            return parser.parseFromString(xAxisTable, "image/svg+xml").documentElement;
        };

        n._xAxisTableHeight = function () {
            let xAxisTableEle = document.getElementById(`xAxisTable${n.canvasData.randomId}`);
            if (xAxisTableEle) {
                let height = parseFloat(getComputedStyle(xAxisTableEle).height);
                let svgH = parseFloat(n.svg.getAttribute("height"));
                xAxisTableEle.parentNode.setAttribute("height", height);
                n.svg.setAttribute("height", svgH + height + 5);
            }
        };

        /**
         * 畫標題
         * @param {BarChart|LineChart|PieChart|MergeBarChart} chart 圖表
         * */
        n._drawTitle = function (chart) {
            let title = "";
            if (n.title) {
                if (typeof chart.drawTitle === "function") {
                    title = chart.drawTitle(n.title);
                } else {
                    title = `<text xmlns="http://www.w3.org/2000/svg" dy="1em" y="${n.canvasData.yAxisLong + n.canvasData.marginT + 28}" x="${n.canvasData.yAxisTextLong + n.canvasData.marginR + n.canvasData.xAxisLong * 0.5}" font-size="${n.title.size || "28px"}" text-anchor="middle">${n.title.text || ""}</text>`;
                }
            }
            let titleNode = parser.parseFromString(title, "image/svg+xml").documentElement;
            n.svg.appendChild(titleNode);
        };

        /**
         * 註釋位置偏移
         * @param {String} type 圖表類型
         * */
        n._notesOffset = function (type) {
            let notes = document.getElementById(`${type}Notes${n.canvasData.randomId}`);
            if (notes) {
                let notesYPos = 0;
                Object.keys(notes.children).map(k => {
                    let textWidth = notes.children[k].querySelector("text").getBBox().width;
                    let omitNumber = 0;
                    if (k > 0) {
                        let offsetX = Object.keys(notes.children).filter(kk => { if (kk < k && kk >= omitNumber) { return notes.children[k].getBoundingClientRect().width; } })
                            .map(i => notes.children[i].getBoundingClientRect().width + 10)
                            .reduce((a, b) => a + b);
                        if (offsetX >= n.canvasData.xAxisLong) {
                            notesYPos += 25;
                            omitNumber = k;
                            notes.children[k].setAttribute("transform", `translate(0, ${notesYPos})`);
                        }
                        notes.children[k].setAttribute("transform", `translate(${-offsetX}, ${notesYPos})`);
                    }
                    notes.children[k].querySelector("g").setAttribute("transform", `translate(${-textWidth}, 0)`);
                });
            }
        };

        /**
        * 畫備註
        * @param {Element} valueWrap 值的最上層元素
        * @param {string} id 值的data-id
        * @param {Element} target 當前觸摸的元素
        */
        n._drawRemark = function (valueWrap, id, target = null) {
            let valueEles = valueWrap.querySelectorAll(`[data-id="${id}"]`);
            let title = "";
            //沒有當前觸摸的元素時抓取同區的所有元素
            if (target) {
                valueEles = Object.keys(valueEles).map(k => valueEles[k]).filter(item => item === target);
            } else {
                valueEles = Object.keys(valueEles).map(k => valueEles[k]);
            }
            let data = valueEles.map(item => {
                let v = item.dataset.value.split(";");
                if (v[3]) {
                    title = v[3];
                }
                return { subject: v[0], color: v[1], value: v[2] };
            });

            let remark = `<div class="remark">
      <table>
      <thead>
      <tr><td>${title}</td></tr>
      </thead>
      <tbody>
      ${data.map((item) => {
                return `<tr style="color:${item.color};">
        <td>${item.subject}：</td>
        <td>${item.value}</td>
        </tr>`;
            }).join("")}
      </tbody>
      </table>
      </div>`;

            let frag = document.createRange().createContextualFragment(remark);
            return frag.children[0];
        };

        n._addEvent = function () {
            window.addEventListener("resize", n._resize);
        };

        /**RWD*/
        n._resize = () => {
            clearTimeout(n.resizeTime);
            n.resizeTime = setTimeout(() => {
                n.canvas.innerHTML = "";
                n.canvasData.width = parseFloat(getComputedStyle(n.canvas).width);//畫布寬
                n.canvasData.height = parseFloat(getComputedStyle(n.canvas).height);//畫布高
                if (n.canvasData.width && n.canvasData.height) {
                    n._init();
                    if (n.canvasData.mergeData != null) {
                        n._mergeInit();
                    }
                }
            }, 300);
        };

        /**刪除 */
        n.destroy = function () {
            window.removeEventListener("resize", n._resize);
            clearTimeout(n.resizeTime);
        };

        /**
        * 軸等分比率計算
        * @param {Number} values 最大值
        * @param {Number} equal 軸等分比率
        */
        n._ratioValue = function (values, equal) {
            let symmetrical = false;//是否要求正負刻度對稱
            let deviation = false;//是否允許誤差，即實際分出的段數不等於splitNumber
            const magics = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];//魔數數組經過擴充，放寬魔數限制避免出現取不到魔數的情況。
            let arr = values;//數據
            let max, min, splitNumber;
            splitNumber = equal;//刻度區間有多少段
            max = Math.max.apply(null, arr);//最大值
            min = Math.min.apply(null, arr);//最小值
            if (!n._numberValid(splitNumber) || splitNumber <= 0) splitNumber = 5;
            if (max * min > 0) {
                if (max < 0) max = 0;
                else min = 0;
            }
            //計算出初始間隔tempGap和縮放比例multiple
            const tempGap = (max - min) / splitNumber;//初始刻度間隔的大小。
            //設tempGap除以multiple後剛剛處於魔數區間內，先求multiple的冪10指數，例如當tempGap為120，想要把tempGap映射到魔數數組（即處理為10到100之間的數），則倍數為10，即10的1次方。
            let multiple = Math.floor(Math.log10(tempGap) - 1);//這裡使用Math.floor的原因是，當Math.log10(tempGap)-1無論是正負數都需要向下取整。不能使用parseInt或其他取整邏輯代替。
            multiple = Math.pow(10, multiple);//剛才是求出指數，這裡求出multiple的實際值
            //取出鄰近較大的魔數執行第一次計算
            const tempStep = tempGap / multiple;//映射後的間隔大小
            let expectedStep = magics[0] * multiple;
            let storedMagicsIndex = -1;//記錄上一次取到的魔數下標，避免出現死循環
            let index; // 當前魔數下標
            for (index = 0; index < magics.length; index++) {
                if (magics[index] > tempStep) {
                    expectedStep = magics[index] * multiple;//取出第一個大於tempStep的魔數，並乘以multiple作為期望得到的最佳間隔
                    break;
                }
            }
            //求出期望的最大刻度和最小刻度，為expectedStep的整數倍
            let axisMax = max;
            let axisMin = min;
            function countDegree(step) {
                axisMax = parseInt("" + (max / step + 1)) * step; // parseInt令小数去尾 -1.8 -> -1
                axisMin = parseInt("" + (min / step - 1)) * step;
                //如果max和min剛好在刻度線的話，則按照上面的邏輯會向上或向下多取一格
                if (max === 0) axisMax = 0;//這裡進行了一次矯正，優先取到0刻度
                if (min === 0) axisMin = 0;
                if (symmetrical && axisMax * axisMin < 0) {//如果需要正負刻度對稱且存在異號數據
                    const tm = Math.max(Math.abs(axisMax), Math.abs(axisMin));//取絕對值較大的一方
                    axisMax = tm;
                    axisMin = -tm;
                }
            }
            countDegree(expectedStep);
            if (deviation) {//如果允許誤差，即實際分段數可以不等於splitNumber，則直接結束
                return n._fixedNum(expectedStep);
            }
            //當正負刻度不對稱且0刻度不在刻度線上時，重新取魔數進行計算//確保其中一條分割線剛好在0刻度上。
            else if (!symmetrical || axisMax * axisMin > 0) {
                let tempSplitNumber;
                out: do {
                    //計算模擬的實際分段數
                    tempSplitNumber = Math.round((axisMax - axisMin) / expectedStep);
                    //當趨勢單調性發生變化時可能出現死循環，需要進行校正
                    if ((index - storedMagicsIndex) * (tempSplitNumber - splitNumber) < 0) {//此處檢查單調性變化且未取到理想分段數
                        //此處的校正基於合理的均勻的魔數數組，即tempSplitNumber和splitNumber的差值較小如1和2，始終取大刻度
                        while (tempSplitNumber < splitNumber) {//讓axisMin或axisMin增大或減少一個expectedStep直到取到理想分段數
                            if ((axisMin - min <= axisMax - max && axisMin !== 0) || axisMax === 0) {
                                axisMin -= expectedStep;
                            } else {
                                axisMax += expectedStep;
                            }
                            tempSplitNumber++;
                            if (tempSplitNumber === splitNumber) break out;
                        }
                    }
                    //當魔數下標越界或取到理想分段數時退出循環
                    if (index >= magics.length - 1 || index <= 0 || tempSplitNumber === splitNumber) break;
                    //記錄上一次的魔數下標
                    storedMagicsIndex = index;
                    //嘗試取符合趨勢的鄰近魔數
                    if (tempSplitNumber > splitNumber) expectedStep = magics[++index] * multiple;
                    else expectedStep = magics[--index] * multiple;
                    //重新計算刻度
                    countDegree(expectedStep);
                } while (tempSplitNumber !== splitNumber);
            }
            //無論計算始終把axisMax-axisMin分成splitNumber段，得到間隔。
            axisMax = n._fixedNum(axisMax);
            axisMin = n._fixedNum(axisMin);
            
            // 儲存軸的範圍資訊，供座標計算使用
            n.canvasData.axisMax = axisMax;
            n.canvasData.axisMin = axisMin;
            n.canvasData.axisRange = axisMax - axisMin;
            
            return n._fixedNum((axisMax - axisMin) / splitNumber);
        };

        /**
        * 解決js的浮點數存在精度問題，在計算出最後結果時可以四捨五入一次，因為刻度太小也沒有意義，所以這裡忽略設置精度為15位
        * @param {(number | string)} num
        * @param {number} [decimal=15]
        * @returns {number} 數字
        */
        n._fixedNum = function (num, decimal = 15) {
            let str = "" + num;
            if (str.indexOf(".") >= 0) str = Number.parseFloat(str).toFixed(decimal);
            return Number.parseFloat(str);
        };

        /**
        * 判断非Infinity非NaN的number
        * @param {*} num 值
        * @returns {boolean} 布林值 
        */
        n._numberValid = function (num) {
            return typeof num === "number" && Number.isFinite(num);
        };

        n._awake();
        n._init();
        n._addEvent();

        return {
            mergeChart: n.mergeChart,
            destroy: n.destroy
        };
    };

    window.NewChart = NewChart;
})();

//柱狀圖
; (function () {
    "use strict";
    const BarChart = function (svg, canvas, isMerge, data = []) {
        if (!(this instanceof BarChart)) return new BarChart();
        const b = this;
        const parser = new DOMParser();
        b.valueBG = null;
        b.valueWrap = null;
        b.remarkEle = null;

        //畫分類註釋
        b.drawNotes = function (notesYPos) {
            let notes = `<g xmlns="http://www.w3.org/2000/svg" id="barNotes${canvas.randomId}" transform="translate(${canvas.xAxisLong + canvas.yAxisTextLong},${notesYPos})">`;
            for (let i = 0; i < data.length; i++) {
                data[i].color = (data[i].color) ? data[i].color : "#000";
                notes += `<g id="g${i}${canvas.randomId}">
                  <g>
                  <rect x="0" y="0" width="8" height="8" fill="${data[i].color}"/>
                  </g>
                  <text dy="8px" x="12" y="0" font-size="12px" text-anchor="end">${data[i].subject}</text>
                  </g>`;
            }
            notes += "</g>";
            let notesNode = parser.parseFromString(notes, "image/svg+xml").documentElement;
            svg.appendChild(notesNode);
        }

        //畫值
        b.drawValue = function (drawRemark, equal, ratio) {
            //x軸一格長取5分之3等分在平分
            const width = canvas.xAxisTextLong * 3 / 5 / (data.length + 1);//一條的寬
            //x軸一格長取5分之2等分在平分
            const spacing = canvas.xAxisTextLong * 2 / 5 / (data.length + 2);//間距
            const unit = isMerge ? canvas.mergeData.axis.y.unit.text : canvas.axis.y.unit.text;
            let val = `<g xmlns="http://www.w3.org/2000/svg" id="barValueWrap${canvas.randomId}" transform="scale(1,-1) translate(${canvas.yAxisTextLong + canvas.marginR + (canvas.xAxisLong - canvas.xAxisTextLong * (canvas.axis.x.categories.length - 1)) / 2 - (width * data.length + spacing * (data.length - 1)) / 2},-${canvas.yAxisLong + canvas.marginT})">`;
            let valueBG = `<g xmlns="http://www.w3.org/2000/svg" id="barValueBG${canvas.randomId}" transform="translate(${canvas.yAxisTextLong + canvas.marginR},${canvas.marginT})">`;
            data.forEach((item, j) => {
                val += `<g xmlns="http://www.w3.org/2000/svg" opacity="1">`;
                item.value.forEach((v, i) => {
                    val += `<rect y="0" x="${canvas.xAxisTextLong * i + (width + spacing) * j}" width="${width}" height="0" fill="${item.color}" data-value="${item.subject};${item.color};${v + (item.unit ? item.unit : unit)};${canvas.axis.x.categories[i]}" data-id="a${i}">
            <animate attributeName="height" attributeType="XML" from="0" to="${Math.abs(v - Math.max(0, canvas.axisMin)) * canvas.yAxisLong / canvas.axisRange}" begin="0s" dur="1s" fill="freeze" />
            </rect>`;
                    if (j === 0) {
                        valueBG += `<rect id="a${i}" fill="rgba(204,214,235,0.4)" x="${canvas.xAxisTextLong * i}" y="0" rx="3" ry="3" width="${canvas.xAxisTextLong}" height="${canvas.yAxisLong}" opacity="0"></rect>`;
                    }
                });
                val += "</g>";
            });

            val += "</g>";
            valueBG += "</g>";
            let valueBGNode = parser.parseFromString(valueBG, "image/svg+xml").documentElement;
            let valNode = parser.parseFromString(val, "image/svg+xml").documentElement;
            svg.appendChild(valueBGNode);
            svg.appendChild(valNode);
            b.valueBG = document.getElementById(`barValueBG${canvas.randomId}`);
            b.valueWrap = document.getElementById(`barValueWrap${canvas.randomId}`);
            b._valueBGEvent(drawRemark);
            b._valueWrapEvent(drawRemark);
        };

        //值背景的事件
        b._valueBGEvent = function (drawRemark) {
            //console.log(b.valueBG.children)
            for (let i = 0; i < b.valueBG.children.length; i++) {
                b.valueBG.children[i].onmouseover = function (e) {
                    if (e.target.getAttribute("opacity") === "0") {
                        e.target.setAttribute("opacity", 1);
                        b.remarkEle = drawRemark(b.valueWrap, e.target.id);
                        b.remarkEle.setAttribute("style", `position:absolute;top:${e.y}px;left:${e.x + canvas.remarkOffset}px;`);
                        document.body.append(b.remarkEle);
                        e.target.onmouseout = () => {
                            if (e.target.getAttribute("opacity") === "1") {
                                e.target.setAttribute("opacity", 0);
                                b.remarkEle.remove();
                                b.remarkEle = null;
                            }
                        };
                    }
                };

                b.valueBG.children[i].onmousemove = (e) => {
                    if (b.remarkEle) {
                        b.remarkEle.style.top = e.pageY + "px";
                        b.remarkEle.style.left = e.pageX + canvas.remarkOffset + "px";
                    }
                };
            }
        };

        //值的事件
        b._valueWrapEvent = function (drawRemark) {
            for (let i = 0; i < b.valueWrap.children.length; i++) {
                b.valueWrap.children[i].onmouseover = function (e) {
                    let thisBG = b.valueBG.querySelector(`#${e.target.getAttribute("data-id")}`);
                    if (thisBG.getAttribute("opacity") === "0") {
                        let otherTarget = b._changeOpacity(e, 0.3);
                        thisBG.setAttribute("opacity", 1);
                        b.remarkEle = drawRemark(b.valueWrap, e.target.getAttribute("data-id"), e.target);
                        b.remarkEle.setAttribute("style", `position:absolute;top:${e.y}px;left:${e.x + canvas.remarkOffset}px;`);
                        document.body.append(b.remarkEle);
                        e.target.onmouseout = () => {
                            if (thisBG.getAttribute("opacity") === "1") {
                                otherTarget.forEach(item => item.setAttribute("opacity", 1));
                                thisBG.setAttribute("opacity", 0);
                                b.remarkEle.remove();
                                b.remarkEle = null;
                            }
                        };
                    }
                };


                b.valueWrap.children[i].onmousemove = (e) => {
                    if (b.remarkEle) {
                        b.remarkEle.style.top = e.pageY + "px";
                        b.remarkEle.style.left = e.pageX + canvas.remarkOffset + "px";
                    }
                };
            }
        };

        b._changeOpacity = function (e, opacity) {
            return Object.keys(b.valueWrap.children).map(k => b.valueWrap.children[k]).filter(a => {
                if (a !== e.target.parentNode) {
                    a.setAttribute("opacity", opacity);
                    return a;
                }
            });
        };

        return {
            drawValue: b.drawValue,
            drawNotes: b.drawNotes
        };
    };

    window.BarChart = BarChart;
})();

//折線圖
; (function () {
    "use strict";
    const LineChart = function (svg, canvas, isMerge, data = []) {
        if (!(this instanceof LineChart)) return new LineChart();
        const l = this;
        const parser = new DOMParser();
        l.valueWrap = null;
        l.circle = null;
        l.remarkEle = null;

        //畫分類註釋
        l.drawNotes = function (notesYPos) {
            let notes = `<g xmlns="http://www.w3.org/2000/svg" id="lineNotes${canvas.randomId}" transform="translate(${canvas.xAxisLong + canvas.yAxisTextLong},${notesYPos})">`;
            for (let i = 0; i < data.length; i++) {
                data[i].color = (data[i].color) ? data[i].color : "#000";
                notes += `<g id="g${i}">
                <g>
                <circle cx="0" cy="0" r="${3}" fill="${data[i].color}"/>
                <line x1="-${6}" y1="0" x2="${6}" y2="0" stroke="${data[i].color}" stroke-width="1"/>
                </g>
                <text dy="${5}px" x="12" y="0" font-size="12px" text-anchor="end">${data[i].subject}</text>
                </g>`;
            }
            notes += "</g>";
            let notesNode = parser.parseFromString(notes, "image/svg+xml").documentElement;
            svg.appendChild(notesNode);
        }

        //畫值
        l.drawValue = function (drawRemark, equal, ratio) {
            let val = `<g xmlns="http://www.w3.org/2000/svg" id="lineValueWrap${canvas.randomId}" transform="translate(${canvas.yAxisTextLong + canvas.marginR + (canvas.xAxisLong - canvas.xAxisTextLong * (canvas.axis.x.categories.length - 1)) / 2},${canvas.marginT})">`;
            let preValue = 0;
            const unit = isMerge ? canvas.mergeData.axis.y.unit.text : canvas.axis.y.unit.text;
            data.forEach((item) => {
                val += "<g>";
                item.value.forEach((v, i) => {
                    val += `<circle cx="${canvas.xAxisTextLong * i}" cy="${canvas.yAxisLong - ((v - canvas.axisMin) * canvas.yAxisLong / canvas.axisRange)}" r="4.5" fill="${item.color}" fill-opacity="0" data-value="${item.subject};${item.color};${v + (item.unit ? item.unit : unit)};${canvas.axis.x.categories[i]}" data-id="a${i}">
            <set attributeName="fill-opacity" from="0" to="1" begin="${i * 0.5}s" fill="freeze"></set>
            </circle>`;
                    if (i > 0) {
                        val += `<line x1="${canvas.xAxisTextLong * (i - 1)}" y1="${canvas.yAxisLong - ((preValue - canvas.axisMin) * canvas.yAxisLong / canvas.axisRange)}" x2="${canvas.xAxisTextLong * (i - 1)}" y2="${canvas.yAxisLong - ((preValue - canvas.axisMin) * canvas.yAxisLong / canvas.axisRange)}" stroke="${item.color}" stroke-width="2.5" data-value="${preValue},${v}">
              <animate attributeName="x2" attributeType="XML" from="${canvas.xAxisTextLong * (i - 1)}" to="${canvas.xAxisTextLong * i}" begin="${(i - 1) * 0.5}s" dur="0.5s" fill="freeze" />
              <animate attributeName="y2" attributeType="XML" from="${canvas.yAxisLong - ((preValue - canvas.axisMin) * canvas.yAxisLong / canvas.axisRange)}" to="${canvas.yAxisLong - ((v - canvas.axisMin) * canvas.yAxisLong / canvas.axisRange)}" begin="${(i - 1) * 0.5}s" dur="0.5s" fill="freeze" />
              </line>`;
                    }
                    preValue = v;
                });
                val += "</g>";
            });
            val += "</g>"
            let valNode = parser.parseFromString(val, "image/svg+xml").documentElement;
            svg.appendChild(valNode);
            l.valueWrap = document.getElementById(`lineValueWrap${canvas.randomId}`);
            l._valueWrapEvent(drawRemark);
        };

        //值的事件
        l._valueWrapEvent = function (drawRemark) {
            for (let i = 0; i < l.valueWrap.children.length; i++) {
                l.valueWrap.children[i].onmouseover = function (e) {
                    e.stopPropagation();
                    let otherTarget = l._changeOpacity(e, 0.4);

                    e.target.onmouseout = () => {
                        otherTarget.forEach(item => item.setAttribute("opacity", 1));
                    };
                };
            }

            l.circle = l.valueWrap.getElementsByTagName("circle");
            for (let i = 0; i < l.circle.length; i++) {
                l.circle[i].onmouseover = function (e) {
                    e.stopPropagation();
                    l.remarkEle = drawRemark(l.valueWrap, e.target.getAttribute("data-id"), e.target);
                    l.remarkEle.setAttribute("style", `position:absolute;top:${e.pageY}px;left:${e.pageX + canvas.remarkOffset}px;`);
                    document.body.append(l.remarkEle);
                    this.setAttribute("r", this.getAttribute("r") * 1 + 2);

                    let otherTarget = l._changeOpacity(e, 0.4);
                    e.target.onmouseout = () => {
                        otherTarget.forEach(item => item.setAttribute("opacity", 1));
                    };
                };

                l.circle[i].onmouseleave = function () {
                    if (l.remarkEle) {
                        l.remarkEle.remove();
                        l.remarkEle = null;
                        this.setAttribute("r", this.getAttribute("r") * 1 - 2);
                    }
                };
            }
        };

        l._changeOpacity = function (e, opacity) {
            return Object.keys(l.valueWrap.children).map(k => l.valueWrap.children[k]).filter(a => {
                if (a !== e.target.parentNode) {
                    a.setAttribute("opacity", opacity);
                    return a;
                } else {
                    l.valueWrap.children[l.valueWrap.children.length - 1].after(a);
                }
            });
        };

        return {
            drawValue: l.drawValue,
            drawNotes: l.drawNotes
        };
    };

    window.LineChart = LineChart;
})();

//圓餅圖
; (function () {
    "use strict";
    const PieChart = function (svg, canvas, data = []) {
        if (!this instanceof PieChart) return new PieChart();
        const p = this;
        const parser = new DOMParser();
        p.r = 120;//半徑
        p.cx = 0;
        p.cy = 0;
        p.rad = Math.PI / 180;//1度的弧
        p.valueWrap = null;
        p.remarkEle = null;

        //畫分類註釋
        p.drawNotes = function () {
            let notes = `<g xmlns="http://www.w3.org/2000/svg" id="pieNotes${canvas.randomId}" transform="translate(${canvas.xAxisLong / 1.2},${canvas.marginT})">`;
            for (let i = 0; i < data.length; i++) {
                data[i].color = (data[i].color) ? data[i].color : "#000";
                notes += `<g id="g${i}">
                  <g>
                  <circle cx="0" cy="0" r="${5}" fill="${data[i].color}"/>
                  </g>
                  <text dy="4px" x="8" y="0" font-size="12px" text-anchor="end">${data[i].subject}</text>
                  </g>`;
            }
            notes += "</g>";
            let notesNode = parser.parseFromString(notes, "image/svg+xml").documentElement;
            svg.appendChild(notesNode);
        }

        //畫標題
        p.drawTitle = function (title) {
            let t = "";
            if (title) {
                t = `<text xmlns="http://www.w3.org/2000/svg" dy="1em" y="${canvas.yAxisLong * 0.5 + canvas.marginT + p.r}" x="${canvas.xAxisLong * 0.5 + canvas.marginR}" font-size="${title.size || "28px"}" text-anchor="middle">${title.text || ""}</text>`;
            }
            return t;
        };

        //畫值
        p.drawValue = async function (drawRemark) {
            let totleValue = data.map(a => a.value).reduce((a, b) => a + b);
            let startAngle = 0;
            let val = `<g xmlns="http://www.w3.org/2000/svg" id="pieValueWrap${canvas.randomId}" transform="translate(${canvas.xAxisLong / 2},${canvas.height / 2.5})">`;
            data.forEach((item, i) => {
                item.color = (item.color) ? item.color : "#000";
                let endAngle = startAngle + 360 * item.value / totleValue;

                val += `<path d="${p._calcD(startAngle, startAngle, p.r)}" fill="${item.color}" stroke="white" stroke-width="2" data-value="${item.subject};${item.color};${item.value}" data-angle="${startAngle},${endAngle}" data-id="a${i}"></path>`;
                startAngle = endAngle;
            });

            val += "</g>";
            let valNode = parser.parseFromString(val, "image/svg+xml").documentElement;
            svg.appendChild(valNode);
            p.valueWrap = document.getElementById(`pieValueWrap${canvas.randomId}`);
            for (let i = 0; i < p.valueWrap.children.length; i++) {
                let promise1 = p._animation2(p.valueWrap.children[i], totleValue);
                await promise1;
            }
            p._valueWrapEvent(drawRemark);
        };

        //算路徑扇形
        p._calcD = function (startAngle, endAngle, r) {
            let x1 = p.cx + r * Math.sin(startAngle * p.rad);
            let y1 = p.cy - r * Math.cos(startAngle * p.rad);
            let x2 = p.cx + r * Math.sin(endAngle * p.rad);
            let y2 = p.cy - r * Math.cos(endAngle * p.rad);
            return `M${p.cx} ${p.cy}L${x1} ${y1}A${r} ${r} 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${x2} ${y2}Z`;
        };

        //值的事件
        p._valueWrapEvent = function (drawRemark) {
            for (let i = 0; i < p.valueWrap.children.length; i++) {
                p.valueWrap.children[i].onmouseover = function (e) {
                    e.stopPropagation();
                    let dis = p.r * 1.1 - p.r;
                    p._animation(e.target, dis);
                    p.remarkEle = drawRemark(p.valueWrap, e.target.getAttribute("data-id"), e.target);
                    p.remarkEle.setAttribute("style", `position:absolute;top:${e.y}px;left:${e.x + canvas.remarkOffset}px;`);
                    document.body.append(p.remarkEle);

                    e.target.onmouseout = () => {
                        p._animation(e.target, 0);
                        p.remarkEle.remove();
                        p.remarkEle = null;
                    };
                };

                p.valueWrap.children[i].onmousemove = (e) => {
                    e.stopPropagation();
                    if (p.remarkEle) {
                        p.remarkEle.style.top = e.pageY + "px";
                        p.remarkEle.style.left = e.pageX + canvas.remarkOffset + "px";
                    }
                };
            }
        };

        //動畫(滑入)
        p._animation = function (target, dis) {
            let time = 0;
            function fnNext() {
                let newR = p.r + dis * time / 10;
                let angles = target.dataset.angle.split(",");
                target.setAttribute("d", p._calcD(angles[0], angles[1], newR));
                time++;
                if (time <= 10) {
                    requestAnimationFrame(fnNext);
                } else {
                    cancelAnimationFrame(fnNext);
                }
            }
            fnNext();
        }

        //動畫2(畫圓)
        p._animation2 = function (target, totleValue) {
            return new Promise(function (res) {
                setTimeout(function () {
                    let a = 0;
                    let angles = target.dataset.angle.split(",");
                    let val = target.dataset.value.split(";")[2];
                    function fnNext() {
                        a += ((val < 30) ? Math.ceil(val * 1 / 30) : Math.floor(val * 1 / 30));
                        let endAngle = angles[0] * 1 + 360 * a / totleValue;
                        target.setAttribute("d", p._calcD(angles[0], (endAngle > angles[1] * 1 ? angles[1] : endAngle), p.r));

                        if (endAngle < angles[1] * 1) {
                            requestAnimationFrame(fnNext);
                        } else {
                            cancelAnimationFrame(fnNext);
                            res();
                        }
                    }
                    fnNext();
                }, 0);
            });

        }

        return {
            drawValue: p.drawValue,
            drawNotes: p.drawNotes,
            drawTitle: p.drawTitle
        };
    };

    window.PieChart = PieChart;
})();

//疊加柱狀圖
; (function () {
    "use strict";
    const MergeBarChart = function (svg, canvas, isMerge, data = []) {
        if (!(this instanceof MergeBarChart)) return new MergeBarChart();
        const m = this;
        const parser = new DOMParser();
        m.valueBG = null;
        m.valueWrap = null;
        m.remarkEle = null;

        //畫分類註釋
        m.drawNotes = function (notesYPos) {
            let notes = `<g xmlns="http://www.w3.org/2000/svg" id="mergebarNotes${canvas.randomId}" transform="translate(${canvas.xAxisLong + canvas.yAxisTextLong},${notesYPos})">`;
            for (let i = 0; i < data.length; i++) {
                data[i].color = (data[i].color) ? data[i].color : "#000";
                notes += `<g id="g${i}${canvas.randomId}">
                  <g>
                  <rect x="0" y="0" width="8" height="8" fill="${data[i].color}"/>
                  </g>
                  <text dy="8px" x="12" y="0" font-size="12px" text-anchor="end">${data[i].subject}</text>
                  </g>`;
            }
            notes += "</g>";
            let notesNode = parser.parseFromString(notes, "image/svg+xml").documentElement;
            svg.appendChild(notesNode);
        }

        //畫值
        m.drawValue = function (drawRemark, equal, ratio) {
            const width = canvas.xAxisTextLong / 2;//一條的寬
            let h = [];
            const unit = isMerge ? canvas.mergeData.axis.y.unit.text : canvas.axis.y.unit.text;
            let val = `<g xmlns="http://www.w3.org/2000/svg" id="mergebarValueWrap${canvas.randomId}" transform="scale(1,-1) translate(${canvas.yAxisTextLong + canvas.marginR + (canvas.xAxisLong - canvas.xAxisTextLong * (canvas.axis.x.categories.length - 1)) / 2 - width / 2},-${canvas.yAxisLong + canvas.marginT})">`;
            let valueBG = `<g xmlns="http://www.w3.org/2000/svg" id="mergebarValueBG${canvas.randomId}" transform="translate(${canvas.yAxisTextLong + canvas.marginR + (canvas.xAxisLong - canvas.xAxisTextLong * (canvas.axis.x.categories.length - 1)) / 2 - width / 2},${canvas.marginT})">`;
            data.forEach((item, j) => {
                if (j == 0) {
                    h = item.value.map(a => 0);
                }
                item.value.forEach((v, i) => {
                    const height = Math.abs(v - Math.max(0, canvas.axisMin)) * canvas.yAxisLong / canvas.axisRange;
                    val += `<rect y="${h[i]}" x="${canvas.xAxisTextLong * i}" width="${width}" height="${h[i]}" fill="${item.color}" data-value="${item.subject};${item.color};${v + (item.unit ? item.unit : unit)};${canvas.axis.x.categories[i]}" data-id="m${i}">
                        <animate attributeName="height" attributeType="XML" from="0" to="${height}" begin="0s" dur="1s" fill="freeze" />
                        </rect>`;
                    h[i] += height;
                    if (j === 0) {
                        valueBG += `<rect id="m${i}" fill="rgba(204,214,235,0.4)" x="${canvas.xAxisTextLong * i}" y="0" rx="3" ry="3" width="${width}" height="${canvas.yAxisLong}" opacity="0"></rect>`;
                    }
                });
            });

            val += "</g>";
            valueBG += "</g>";
            let valueBGNode = parser.parseFromString(valueBG, "image/svg+xml").documentElement;
            let valNode = parser.parseFromString(val, "image/svg+xml").documentElement;
            svg.appendChild(valueBGNode);
            svg.appendChild(valNode);
            m.valueBG = document.getElementById(`mergebarValueBG${canvas.randomId}`);
            m.valueWrap = document.getElementById(`mergebarValueWrap${canvas.randomId}`);
            m._valueBGEvent(drawRemark);
            m._valueWrapEvent(drawRemark);
        };

        //值背景的事件
        m._valueBGEvent = function (drawRemark) {
            //console.log(m.valueBG.children)
            for (let i = 0; i < m.valueBG.children.length; i++) {
                m.valueBG.children[i].onmouseover = function (e) {
                    if (e.target.getAttribute("opacity") === "0") {
                        e.target.setAttribute("opacity", 1);
                        m.remarkEle = drawRemark(m.valueWrap, e.target.id);
                        m.remarkEle.setAttribute("style", `position:absolute;top:${e.y}px;left:${e.x + canvas.remarkOffset}px;`);
                        document.body.append(m.remarkEle);
                        e.target.onmouseout = () => {
                            if (e.target.getAttribute("opacity") === "1") {
                                e.target.setAttribute("opacity", 0);
                                m.remarkEle.remove();
                                m.remarkEle = null;
                            }
                        };
                    }
                };

                m.valueBG.children[i].onmousemove = (e) => {
                    if (m.remarkEle) {
                        m.remarkEle.style.top = e.pageY + "px";
                        m.remarkEle.style.left = e.pageX + canvas.remarkOffset + "px";
                    }
                };
            }
        };

        //值的事件
        m._valueWrapEvent = function (drawRemark) {
            for (let i = 0; i < m.valueWrap.children.length; i++) {
                m.valueWrap.children[i].onmouseover = function (e) {
                    let thisBG = m.valueBG.querySelector(`#${e.target.getAttribute("data-id")}`);
                    if (thisBG.getAttribute("opacity") === "0") {
                        thisBG.setAttribute("opacity", 1);
                        m.remarkEle = drawRemark(m.valueWrap, e.target.getAttribute("data-id"), e.target);
                        m.remarkEle.setAttribute("style", `position:absolute;top:${e.y}px;left:${e.x + canvas.remarkOffset}px;`);
                        document.body.append(m.remarkEle);
                        e.target.onmouseout = () => {
                            if (thisBG.getAttribute("opacity") === "1") {
                                thisBG.setAttribute("opacity", 0);
                                m.remarkEle.remove();
                                m.remarkEle = null;
                            }
                        };
                    }
                };


                m.valueWrap.children[i].onmousemove = (e) => {
                    if (m.remarkEle) {
                        m.remarkEle.style.top = e.pageY + "px";
                        m.remarkEle.style.left = e.pageX + canvas.remarkOffset + "px";
                    }
                };
            }
        };

        return {
            drawValue: m.drawValue,
            drawNotes: m.drawNotes
        };
    };

    window.MergeBarChart = MergeBarChart;
})();