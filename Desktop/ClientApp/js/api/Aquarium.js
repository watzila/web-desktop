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
    }

}