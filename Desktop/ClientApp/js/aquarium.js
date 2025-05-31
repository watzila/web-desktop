import BaseComponent from "./BaseComponent.js";
//import Ajax from "./component/ajax.js";
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

        this.init();
    }

    init() {
        this.fishImg.src = '../images/fish1.png';
        // 初始魚
        for (let i = 0; i < 3; i++) {
            this.fishes.push(new Fish(100 + i * 200, 100 + Math.random() * 100));
        }

        this.setEvent(this.canvas, "click", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.pellets.push(new Pellet(e.clientX - rect.left, e.clientY - rect.top));
        });

        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(now) {
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const pellet of this.pellets) {
            pellet.update(this.canvas, deltaTime);
            pellet.draw(this.ctx);
        }

        for (const fish of this.fishes) {
            fish.update(this.canvas, deltaTime, this.pellets, this.coins, this.coinEle);
            fish.draw(this.ctx, this.fishImg);
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }

}

class Fish {
    constructor(x, y) {
        this.SPRITE_FRAME_COUNT = 4;
        this.SPRITE_WIDTH = 84;
        this.SPRITE_HEIGHT = 59;
        this.x = x;
        this.y = y;
        this.dirX = Math.random() < 0.5 ? -1 : 1;
        this.dirY = (Math.random() - 0.5) * 0.5;
        this.width = this.SPRITE_WIDTH / 2;
        this.height = this.SPRITE_HEIGHT / 2;
        this.baseSpeed = 30 + Math.random() * 50;
        this.speed = this.baseSpeed;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 0.2;
        this.coinTimer = 0;
        this.coinInterval = 3;
        this.changeDirTimer = 0;
        this.changeDirInterval = Math.random() * 3 + 2;
        this.targetPellet = null;
    }

    update(canvas, deltaTime, pellets, coins, coinEle) {
        if (this.targetPellet && !pellets.includes(this.targetPellet)) {
            this.targetPellet = null;
        }

        this.changeDirTimer += deltaTime;
        if (this.changeDirTimer >= this.changeDirInterval && !this.targetPellet) {
            this.dirX *= Math.random() < 0.2 ? -1 : 1;
            this.dirY = (Math.random() - 0.5) * 0.8;
            this.changeDirTimer = 0;
            this.changeDirInterval = Math.random() * 3 + 2;
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
            this.speed = 100; // 鎖定飼料時速度統一為 100
            const dx = this.targetPellet.x - this.x;
            const dy = this.targetPellet.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 10) {
                const index = pellets.indexOf(this.targetPellet);
                if (index > -1) pellets.splice(index, 1);
                this.targetPellet = null;
                this.speed = this.baseSpeed; // 吃到後恢復
            } else {
                this.x += (dx / dist) * this.speed * deltaTime;
                this.y += (dy / dist) * this.speed * deltaTime;
                this.dirX = dx > 0 ? 1 : -1;
            }
        } else {
            this.speed = this.baseSpeed;
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

        this.coinTimer += deltaTime;
        if (this.coinTimer >= this.coinInterval) {
            coins += 1;
            coinEle.innerText = coins;
            this.coinTimer = 0;
        }

        this.frameTimer += deltaTime;
        if (this.frameTimer >= this.frameInterval) {
            this.frame = (this.frame + 1) % this.SPRITE_FRAME_COUNT;
            this.frameTimer = 0;
        }
    }


    draw(ctx, fishImg) {
        const sx = this.frame * this.SPRITE_WIDTH;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.dirX, 1);
        ctx.drawImage(
            fishImg,
            sx, 0,
            this.SPRITE_WIDTH, this.SPRITE_HEIGHT,
            -this.width / 2, -this.height / 2,
            this.width, this.height
        );
        ctx.restore();
    }
}

class Pellet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 35 // 飼料掉落速度（單位：每秒）
    }

    update(canvas, deltaTime) {
        this.y += this.speed * deltaTime;
        if (this.y > canvas.height - 5) {
            this.y = canvas.height - 5; // 到水底停住
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

export default Aquarium;