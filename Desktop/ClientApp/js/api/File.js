export default {
  "/api/File/Text": async (ctx, req) => {
    const db = await ctx.getDBInstance();
    const data = await ctx.getStore(db, "Files", (item) => item.id == req.id);

    const result = data.map((item) => ({
      ...item
    }));

    return {
      returnCode: 200,
      returnMsg: "success",
      returnData: { data: result },
      js: "table"
    };
  }
};