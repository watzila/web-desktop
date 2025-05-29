export default {
    "/api/Music/List": async (ctx) => {
        const db = await ctx.getDBInstance();
        const data = await ctx.getStore(db, "Music", () => true, {
            sortBy: "sort"
        });

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: { data: data },
            js: "music"
        };
    },
    "/api/Music/Add": async (ctx, data) => {
        const db = await ctx.getDBInstance();
        data.id = ctx.newid();
        data.sort = (await ctx.getStore(db, "Music", () => true)).length + 1;
        ctx.writeStore(db, "Music", data);

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: data.id,
            js: null
        };
    },
    "/api/Music/Delete": async (ctx, data) => {
        const db = await ctx.getDBInstance();
        ctx.deleteStore(db, "Music", data.id);
    }
};