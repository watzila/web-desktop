export default {
    "/api/Aquarium/Index": async (ctx) => {
        //const db = await ctx.getDBInstance();
        //const data = await ctx.getStore(db, "Fish", () => true, {
        //    sortBy: "sort"
        //});

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: { data: null },
            js: "aquarium"
        };
    },
    "/api/Aquarium/Gacha": async (ctx) => {
        const db = await ctx.getDBInstance();
        const fishData = await ctx.getStore(db, "Fishes");
        const rarityConfig = {
            "common": {
                "displayName": "普通",
                "color": "#CCCCCC",
                "icon": "⚪",
                "totalWeight": 120
            },
            "rare": {
                "displayName": "稀有",
                "color": "#4A90E2",
                "icon": "🔵",
                "totalWeight": 50
            },
            "epic": {
                "displayName": "史詩",
                "color": "#9B59B6",
                "icon": "🟣",
                "totalWeight": 24
            },
            "legendary": {
                "displayName": "傳說",
                "color": "#F39C12",
                "icon": "🟡",
                "totalWeight": 3
            }
        };
        const gachaConfig = {
            "basicGachaCost": 100,
            "premiumGachaCost": 500,
            "tenGachaCost": 900,
            "premiumRarityBoost": 1.5
        };

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: { fishData, rarityConfig, gachaConfig },
            js: null
        };

    }

}