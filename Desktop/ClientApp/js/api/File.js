export default {
    "/api/File/Text": async (ctx, req) => {
        const db = await ctx.getDBInstance();
        const data = await ctx.getStore(db, "Files", (item) => item.id.toUpperCase() == req.id.toUpperCase());

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: data[0],
            js: "table"
        };
    }
};