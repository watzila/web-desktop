import BaseComponent from "./BaseComponent.js";
import GachaSystem from "./component/gachaSystem.js";
import Ajax from "./component/ajax.js";
//import eventBus from "./component/eventBus.js";
class Aquarium extends BaseComponent {
    constructor(id, model) {
        super(id);
        this.canvas = this.iframe.querySelector('#aquarium');
        this.ctx = this.canvas.getContext('2d');
        this.coinEle = this.iframe.querySelector("#coins");
        this.coins = 100;
        this.fishes = [];
        this.pellets = [];
        this.lastTime;
        this.fishImg = new Image();
        this.resizeObserver;
        this.navEle = this.iframe.querySelector("nav");
        this.selectedFish = null;  // 當前選中的魚
        this.gachaSystem = new GachaSystem();  // 轉蛋系統
        this.gachaResult = null;  // 轉蛋結果暫存

        this.init();
    }

    async init() {
        this.fishImg.src = './images/fish1.png';

        // 載入轉蛋系統資料
        Ajax.conn({
            type: "post", url: "/api/Aquarium/Gacha", fn: (res) => {
                this.gachaSystem.loadFishData(res.returnData);
            }
        });

        // 設定初始 canvas 尺寸
        this.resizeCanvas();

        // 監聽視窗大小變化
        this.resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
        });
        this.resizeObserver.observe(this.iframe);

        // 初始魚
        for (let i = 0; i < 3; i++) {
            this.fishes.push(new Fish(100 + i * 200, 100 + Math.random() * 100));
        }

        // Canvas 點擊事件：檢查是否點中魚，否則投放飼料
        this.setEvent(this.canvas, "click", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // 檢查是否點中任何魚
            let clickedFish = null;
            for (const fish of this.fishes) {
                if (fish.isPointInside(clickX, clickY)) {
                    clickedFish = fish;
                    break;
                }
            }

            if (clickedFish) {
                // 點中魚，設置選中並顯示資訊
                this.selectedFish = clickedFish;
                this.showFishInfo(clickedFish);
            } else {
                // 沒點中魚，取消選中並投放飼料
                this.selectedFish = null;
                this.hideFishInfo();
                this.pellets.push(new Pellet(clickX, clickY));
            }
        });

        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));

        this.PanelEvent();
    }

    PanelEvent() {
        // 關於按鈕
        this.setEvent(this.navEle.querySelector("#aboutBTN"), "click", () => {
            this.iframe.querySelector("#aboutWrap").show();
        });

        // 結束按鈕
        this.setEvent(this.navEle.querySelector("#closeBTN"), "click", () => {
            this.iframe.querySelector("#closeWindow").click();
        });

        // 商店按鈕 - 開啟轉蛋對話框
        this.setEvent(this.navEle.querySelector("#openShopBTN"), "click", () => {
            this.openGachaDialog();
        });

        // 基礎轉蛋按鈕
        this.setEvent(this.iframe.querySelector("#basicGachaBTN"), "click", () => {
            this.performGacha('basic');
        });

        // 十連抽按鈕
        this.setEvent(this.iframe.querySelector("#tenGachaBTN"), "click", () => {
            this.performGacha('ten');
        });

        // 放入水族箱按鈕
        this.setEvent(this.iframe.querySelector("#addFishToTankBTN"), "click", () => {
            this.addGachaFishToTank();
        });
    }

    /**
     * 顯示魚的資訊框（固定在右上角）
     * @param {Fish} fish - 被點擊的魚
     */
    showFishInfo(fish) {
        // 移除舊的資訊框（如果存在）
        this.hideFishInfo();

        // 創建新的資訊框
        const infoDiv = document.createElement('div');
        infoDiv.className = 'fish-info-popup';
        infoDiv.style.cssText = `
            position: absolute;
            right: 10px;
            top: 75px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 16px;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
            min-width: 180px;`;

        // 填充資訊
        const rarityIcon = {
            common: '⚪',
            rare: '🔵',
            epic: '🟣',
            legendary: '🟡'
        };

        infoDiv.innerHTML = `
            <div style="margin-bottom: 6px; font-size: 18px;">
                ${rarityIcon[fish.rarity] || '⚪'} ${fish.name}
            </div>
            <div style="color: #aaa; font-size: 14px; margin-bottom: 8px;">
                ${fish.species}
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 5px;">
                <div>⏱️ 產幣倒數: <span style="color: #4CAF50;" class="coin-timer">${fish.coinTimer.toFixed(1)}s</span></div>
                <div>💰 產幣間隔: ${fish.coinInterval}s</div>
                <div>💎 產幣數量: ${fish.coinValue}</div>
            </div>
        `;

        this.canvas.parentNode.appendChild(infoDiv);
    }

    /**
     * 隱藏魚的資訊框
     */
    hideFishInfo() {
        const oldInfo = this.canvas.parentNode.querySelector('.fish-info-popup');
        if (oldInfo) oldInfo.remove();
    }

    /**
     * 開啟轉蛋對話框
     */
    openGachaDialog() {
        // 更新對話框中的金幣顯示
        const gachaCoinsEle = this.iframe.querySelector('#gachaCoins');
        if (gachaCoinsEle) {
            gachaCoinsEle.textContent = this.coins;
        }

        // 顯示對話框
        this.iframe.querySelector('#gachaWrap').show();
    }

    /**
     * 執行轉蛋
     * @param {string} type - 轉蛋類型：'basic' 或 'ten'
     */
    performGacha(type) {
        const cost = this.gachaSystem.getGachaCost(type);

        // 檢查金幣是否足夠
        if (this.coins < cost) {
            alert('金幣不足！需要 ' + cost + ' 金幣。');
            return;
        }

        // 扣除金幣
        this.coins -= cost;
        this.coinEle.textContent = this.coins;

        // 執行轉蛋
        let result;
        if (type === 'ten') {
            result = this.gachaSystem.performTenGacha();
        } else {
            result = this.gachaSystem.performBasicGacha();
        }

        // 儲存結果
        this.gachaResult = result;

        // 關閉轉蛋對話框
        this.iframe.querySelector('#gachaWrap').close();

        // 顯示結果
        this.showGachaResult(result);
    }

    /**
     * 顯示轉蛋結果
     * @param {Object|Array} result - 轉蛋結果（單個或陣列）
     */
    showGachaResult(result) {
        const resultContent = this.iframe.querySelector('#gachaResultContent');
        const isMultiple = Array.isArray(result);

        if (isMultiple) {
            // 十連抽結果
            let html = '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px;">';
            result.forEach(fish => {
                html += `
                    <div style="padding: 8px; border: 2px solid ${fish.rarityColor}; border-radius: 8px; background: white;">
                        <div style="font-size: 24px;">${fish.rarityIcon}</div>
                        <div style="font-size: 10px; margin-top: 4px;">${fish.name}</div>
                    </div>
                `;
            });
            html += '</div>';

            // 統計稀有度
            const rarityCount = {};
            result.forEach(fish => {
                rarityCount[fish.rarity] = (rarityCount[fish.rarity] || 0) + 1;
            });

            html += '<div style="font-size: 14px; color: #666;">';
            html += '<div><b>獲得統計：</b></div>';
            for (const [rarity, count] of Object.entries(rarityCount)) {
                const config = this.gachaSystem.getRarityConfig()[rarity];
                html += `<div>${config.icon} ${config.displayName}: ${count} 隻</div>`;
            }
            html += '</div>';

            resultContent.innerHTML = html;
        } else {
            // 單抽結果
            resultContent.innerHTML = `
                <div style="font-size: 64px; margin-bottom: 16px;">${result.rarityIcon}</div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px; color: ${result.rarityColor};">
                    ${result.name}
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 16px;">
                    ${result.rarityDisplayName} | ${result.species}
                </div>
                <div style="padding: 12px; background: #f9f9f9; border-radius: 8px; text-align: left;">
                    <div style="margin-bottom: 8px;">${result.description}</div>
                    <div style="border-top: 1px solid #ddd; padding-top: 8px; font-size: 13px;">
                        <div>💰 產幣間隔: ${result.coinInterval}s</div>
                        <div>💎 產幣數量: ${result.coinValue}</div>
                        <div>🏃 移動速度: ${result.speed}</div>
                    </div>
                </div>
            `;
        }

        // 顯示結果對話框
        this.iframe.querySelector('#gachaResultWrap').show();
    }

    /**
     * 將轉蛋獲得的魚添加到水族箱
     */
    addGachaFishToTank() {
        if (!this.gachaResult) return;

        const results = Array.isArray(this.gachaResult) ? this.gachaResult : [this.gachaResult];

        // 為每隻魚創建實例並添加到水族箱
        results.forEach((fishData, index) => {
            // 隨機位置（避免重疊）
            const x = 100 + (index % 3) * 200 + Math.random() * 100;
            const y = 100 + Math.floor(index / 3) * 100 + Math.random() * 50;

            const newFish = new Fish(x, y, {
                name: fishData.name,
                species: fishData.species,
                rarity: fishData.rarity,
                speed: fishData.speed,
                coinInterval: fishData.coinInterval,
                coinValue: fishData.coinValue
            });

            this.fishes.push(newFish);
        });

        // 清空結果
        this.gachaResult = null;

        // 關閉結果對話框
        this.iframe.querySelector('#gachaResultWrap').close();

        // 顯示提示
        const count = results.length;
        alert(`已將 ${count} 隻魚放入水族箱！`);
    }

    resizeCanvas() {
        const rect = this.canvas.parentNode.getBoundingClientRect();

        // 設定 canvas 實際像素尺寸等於顯示尺寸
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    gameLoop(now) {
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const pellet of this.pellets) {
            pellet.update(this.canvas, deltaTime);
            pellet.draw(this.ctx);
        }

        // 更新所有魚
        for (const fish of this.fishes) {
            fish.update(this.canvas, deltaTime, this.pellets, (coinValue) => {
                // 產幣回調，接收產幣數量
                this.coins += coinValue;
                this.coinEle.innerText = this.coins;
            });
        }

        // 先繪製未選中的魚
        for (const fish of this.fishes) {
            if (fish !== this.selectedFish) {
                fish.draw(this.ctx, this.fishImg, false);
            }
        }

        // 最後繪製選中的魚（在最上層）
        if (this.selectedFish) {
            this.selectedFish.draw(this.ctx, this.fishImg, true);
        }

        // 更新選中魚的資訊框倒數時間
        if (this.selectedFish) {
            const timerEle = this.canvas.parentNode.querySelector('.coin-timer');
            if (timerEle) {
                timerEle.textContent = `${this.selectedFish.coinTimer.toFixed(1)}s`;
            }
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        super.destroy();
    }

}

class Fish {
    constructor(x, y, data = {}) {
        // 精靈圖設定
        this.SPRITE_FRAME_COUNT = 4;
        this.SPRITE_WIDTH = 84;
        this.SPRITE_HEIGHT = 59;

        // 位置與方向
        this.x = x;
        this.y = y;
        this.dirX = Math.random() < 0.5 ? -1 : 1;
        this.dirY = (Math.random() - 0.5) * 0.5;
        this.width = this.SPRITE_WIDTH / 2;
        this.height = this.SPRITE_HEIGHT / 2;

        // 移動速度
        this.baseSpeed = data.speed || (30 + Math.random() * 50);  // 最大速度
        this.speed = Math.random() * this.baseSpeed;  // 當前速度（隨機初始值）
        this.targetSpeed = this.speed;  // 目標速度
        this.maxSpeed = this.baseSpeed;  // 儲存最大速度上限

        // 動畫相關
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 0.2;

        // 產幣系統（改為倒數計時）
        this.coinInterval = data.coinInterval || 30;  // 產幣間隔（秒）
        this.coinValue = data.coinValue || 1;        // 每次產幣數量
        this.coinTimer = this.coinInterval;          // 從間隔開始倒數

        // AI 行為
        this.changeDirTimer = 0;
        this.changeDirInterval = Math.random() * 3 + 2;
        this.speedChangeTimer = 0;
        this.speedChangeInterval = Math.random() * 4 + 3;  // 3-7 秒改變一次速度
        this.targetPellet = null;

        // 魚類資訊（未來擴展用）
        this.name = data.name || "基礎熱帶魚";
        this.species = data.species || "basic_fish";
        this.rarity = data.rarity || "common";
    }

    update(canvas, deltaTime, pellets, fn) {
        if (this.targetPellet && !pellets.includes(this.targetPellet)) {
            this.targetPellet = null;
        }

        // 隨機改變方向（沒有追蹤飼料時）
        this.changeDirTimer += deltaTime;
        if (this.changeDirTimer >= this.changeDirInterval && !this.targetPellet) {
            this.dirX *= Math.random() < 0.2 ? -1 : 1;
            this.dirY = (Math.random() - 0.5) * 0.8;
            this.changeDirTimer = 0;
            this.changeDirInterval = Math.random() * 3 + 2;
        }

        // 隨機改變速度（沒有追蹤飼料時）
        this.speedChangeTimer += deltaTime;
        if (this.speedChangeTimer >= this.speedChangeInterval && !this.targetPellet) {
            // 隨機目標速度：15% 機率靜止，85% 機率隨機速度
            if (Math.random() < 0.15) {
                this.targetSpeed = 0;  // 靜止不動
            } else {
                this.targetSpeed = Math.random() * this.maxSpeed * 0.8 + this.maxSpeed * 0.2;  // 20%-100% 最大速度
            }
            this.speedChangeTimer = 0;
            this.speedChangeInterval = Math.random() * 4 + 3;  // 3-7 秒
        }

        // 平滑過渡到目標速度
        if (!this.targetPellet) {
            const speedDiff = this.targetSpeed - this.speed;
            this.speed += speedDiff * deltaTime * 2;  // 每秒過渡 200%

            // 確保速度不超過最大值
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
            if (this.speed < 0) this.speed = 0;
        }

        // --- 加一個找最近飼料的冷卻計時器 ---
        this.findPelletTimer = (this.findPelletTimer || 0) + deltaTime;
        if (this.findPelletTimer >= 0.2) { // 每0.2秒才找一次
            if (pellets.length > 0) {
                let nearest = null;
                let minDist = Infinity;
                for (const p of pellets) {
                    const d = Math.hypot(p.x - this.x, p.y - this.y);
                    if (d < minDist) {
                        nearest = p;
                        minDist = d;
                    }
                }
                if (nearest) this.targetPellet = nearest;
            } else {
                this.targetPellet = null;
            }
            this.findPelletTimer = 0;
        }

        if (this.targetPellet) {
            // 追蹤飼料時加速到最大速度
            this.speed = this.maxSpeed * 1.5;  // 加速 150%
            const dx = this.targetPellet.x - this.x;
            const dy = this.targetPellet.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 10) {
                // 吃到飼料，減少產幣倒數時間
                this.eatPellet(this.targetPellet.speedBoost);

                const index = pellets.indexOf(this.targetPellet);
                if (index > -1) pellets.splice(index, 1);
                this.targetPellet = null;
                // 吃到後恢復到目標速度（不是固定速度）
                this.speed = this.targetSpeed;
            } else {
                this.x += (dx / dist) * this.speed * deltaTime;
                this.y += (dy / dist) * this.speed * deltaTime;
                this.dirX = dx > 0 ? 1 : -1;
            }
        } else {
            // 正常移動（使用當前速度，而非固定 baseSpeed）
            this.x += this.dirX * this.speed * deltaTime;
            this.y += this.dirY * this.speed * deltaTime;
        }

        if (this.x < this.width / 2) {
            this.x = this.width / 2;
            this.dirX *= -1;
        }
        if (this.x > canvas.width - this.width / 2) {
            this.x = canvas.width - this.width / 2;
            this.dirX *= -1;
        }
        if (this.y < this.height / 2) {
            this.y = this.height / 2;
            this.dirY *= -1;
        }
        if (this.y > canvas.height - this.height / 2) {
            this.y = canvas.height - this.height / 2;
            this.dirY *= -1;
        }

        // 產幣倒數計時（改為遞減）
        this.coinTimer -= deltaTime;
        if (this.coinTimer <= 0) {
            fn(this.coinValue);  // 產幣，傳遞產幣數量
            this.coinTimer = this.coinInterval;  // 重置倒數
        }

        // 動畫幀更新（速度影響動畫速度）
        if (this.speed > 5) {  // 只有在移動時才播放動畫
            this.frameTimer += deltaTime;
            // 根據速度調整動畫速度（速度越快，動畫越快）
            const animSpeed = this.frameInterval * (this.maxSpeed / Math.max(this.speed, 10));
            if (this.frameTimer >= animSpeed) {
                this.frame = (this.frame + 1) % this.SPRITE_FRAME_COUNT;
                this.frameTimer = 0;
            }
        }
    }


    draw(ctx, fishImg, isSelected = false) {
        const sx = this.frame * this.SPRITE_WIDTH;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.dirX, 1);

        // 繪製魚的精靈圖
        ctx.drawImage(
            fishImg,
            sx, 0,
            this.SPRITE_WIDTH, this.SPRITE_HEIGHT,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );

        // 如果被選中，繪製高亮邊框
        if (isSelected) {
            ctx.strokeStyle = '#FFD700';  // 金色
            ctx.lineWidth = 3;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.strokeRect(
                -this.width / 2 - 5,
                -this.height / 2 - 5,
                this.width + 10,
                this.height + 10
            );
            ctx.shadowBlur = 0;  // 重置陰影
        }

        ctx.restore();
    }

    /**
     * 吃飼料時減少產幣倒數時間
     * @param {number} speedBoost - 減少的秒數
     */
    eatPellet(speedBoost) {
        this.coinTimer = Math.max(0, this.coinTimer - speedBoost);
    }

    /**
     * 檢測點是否在魚的碰撞範圍內（用於點擊檢測）
     * @param {number} x - 點擊的 x 座標
     * @param {number} y - 點擊的 y 座標
     * @returns {boolean} 是否點中魚
     */
    isPointInside(x, y) {
        return (
            x >= this.x - this.width / 2 &&
            x <= this.x + this.width / 2 &&
            y >= this.y - this.height / 2 &&
            y <= this.y + this.height / 2
        );
    }
}

class Pellet {
    constructor(x, y, type = "basic") {
        this.x = x;
        this.y = y;
        this.speed = 35;  // 飼料掉落速度（單位：像素/秒）
        this.type = type; // 飼料類型

        // 根據類型設定屬性
        this.setTypeProperties(type);
    }

    /**
     * 根據飼料類型設定屬性
     * @param {string} type - 飼料類型
     */
    setTypeProperties(type) {
        const typeConfig = {
            basic: {
                speedBoost: 0.5,    // 減少 0.5 秒
                color: "#795548",   // 棕色
                name: "基礎飼料"
            },
            premium: {
                speedBoost: 1.5,    // 減少 1.5 秒
                color: "#FF9800",   // 橙色
                name: "高級飼料"
            },
            super: {
                speedBoost: 3,      // 減少 3 秒
                color: "#F44336",   // 紅色
                name: "超級飼料"
            }
        };

        const config = typeConfig[type] || typeConfig.basic;
        this.speedBoost = config.speedBoost;
        this.color = config.color;
        this.name = config.name;
    }

    update(canvas, deltaTime) {
        this.y += this.speed * deltaTime;
        if (this.y > canvas.height - 5) {
            this.y = canvas.height - 5; // 到水底停住
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

export default Aquarium;