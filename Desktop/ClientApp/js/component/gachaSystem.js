/**
 * 轉蛋系統
 * 負責處理抽卡邏輯、機率計算、結果生成
 */
class GachaSystem {
    constructor() {
        this.fishData = null;
        this.rarityConfig = null;
        this.gachaConfig = null;
    }

    /**
     * 載入魚類資料
     */
    loadFishData(data) {
        this.fishData = data.fishData;
        this.rarityConfig = data.rarityConfig;
        this.gachaConfig = data.gachaConfig;
    }

    /**
     * 執行轉蛋（基礎版）
     * @returns {Object} 抽到的魚類資料
     */
    performBasicGacha() {
        return this.performGacha(1.0);
    }

    /**
     * 執行轉蛋（高級版，提升稀有度機率）
     * @returns {Object} 抽到的魚類資料
     */
    performPremiumGacha() {
        return this.performGacha(this.gachaConfig.premiumRarityBoost);
    }

    /**
     * 執行轉蛋核心邏輯
     * @param {number} rarityBoost - 稀有度加成（1.0 = 無加成）
     * @returns {Object} 抽到的魚類資料
     */
    performGacha(rarityBoost = 1.0) {
        if (!this.fishData) {
            console.error('魚類資料尚未載入');
            return null;
        }

        // 計算總權重
        let totalWeight = 0;
        const weightedFishes = this.fishData.map(fish => {
            // 根據稀有度調整權重
            let adjustedWeight = fish.gachaWeight;
            if (fish.rarity !== 'common' && rarityBoost > 1.0) {
                adjustedWeight *= rarityBoost;
            }
            totalWeight += adjustedWeight;
            return { ...fish, adjustedWeight };
        });

        // 隨機抽取
        let random = Math.random() * totalWeight;
        let cumulative = 0;

        for (const fish of weightedFishes) {
            cumulative += fish.adjustedWeight;
            if (random <= cumulative) {
                // 返回魚類副本（避免修改原始資料）
                return this.createFishInstance(fish);
            }
        }

        // 容錯：如果沒抽到（理論上不會發生），返回第一隻魚
        return this.createFishInstance(weightedFishes[0]);
    }

    /**
     * 創建魚類實例
     * @param {Object} fishData - 魚類資料
     * @returns {Object} 魚類實例
     */
    createFishInstance(fishData) {
        return {
            id: fishData.id,
            name: fishData.name,
            species: fishData.species,
            rarity: fishData.rarity,
            spriteSheet: fishData.spriteSheet,
            frameCount: fishData.frameCount,
            size: { ...fishData.size },
            speed: fishData.speed,
            coinInterval: fishData.coinInterval,
            coinValue: fishData.coinValue,
            description: fishData.description,
            rarityIcon: this.rarityConfig[fishData.rarity].icon,
            rarityDisplayName: this.rarityConfig[fishData.rarity].displayName,
            rarityColor: this.rarityConfig[fishData.rarity].color
        };
    }

    /**
     * 取得轉蛋費用
     * @param {string} type - 轉蛋類型：'basic', 'premium', 'ten'
     * @returns {number} 費用
     */
    getGachaCost(type = 'basic') {
        switch (type) {
            case 'basic':
                return this.gachaConfig.basicGachaCost;
            case 'premium':
                return this.gachaConfig.premiumGachaCost;
            case 'ten':
                return this.gachaConfig.tenGachaCost;
            default:
                return this.gachaConfig.basicGachaCost;
        }
    }

    /**
     * 執行十連抽
     * @returns {Array} 抽到的魚類陣列
     */
    performTenGacha() {
        const results = [];
        for (let i = 0; i < 10; i++) {
            // 第 10 抽保底稀有以上
            if (i === 9) {
                results.push(this.performGuaranteedRareGacha());
            } else {
                results.push(this.performBasicGacha());
            }
        }
        return results;
    }

    /**
     * 保底稀有轉蛋（排除普通品質）
     * @returns {Object} 抽到的魚類資料
     */
    performGuaranteedRareGacha() {
        const rareFishes = this.fishData.filter(fish => fish.rarity !== 'common');

        let totalWeight = 0;
        const weightedFishes = rareFishes.map(fish => {
            totalWeight += fish.gachaWeight;
            return { ...fish, adjustedWeight: fish.gachaWeight };
        });

        let random = Math.random() * totalWeight;
        let cumulative = 0;

        for (const fish of weightedFishes) {
            cumulative += fish.adjustedWeight;
            if (random <= cumulative) {
                return this.createFishInstance(fish);
            }
        }

        return this.createFishInstance(weightedFishes[0]);
    }

    /**
     * 取得所有魚類資料（供圖鑑使用）
     * @returns {Array} 魚類陣列
     */
    getAllFishes() {
        return this.fishData ? [...this.fishData] : [];
    }

    /**
     * 根據稀有度取得魚類
     * @param {string} rarity - 稀有度
     * @returns {Array} 該稀有度的魚類陣列
     */
    getFishesByRarity(rarity) {
        return this.fishData ? this.fishData.filter(fish => fish.rarity === rarity) : [];
    }

    /**
     * 取得稀有度配置
     * @returns {Object} 稀有度配置
     */
    getRarityConfig() {
        return this.rarityConfig;
    }
}

export default GachaSystem;
