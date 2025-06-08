export default {
  "/api/Folder/List": async (ctx, req) => {
    const db = await ctx.getDBInstance();
    const data = await ctx.getStore(db, "ACLObject", (item) => item.status == 1 && item.parentID == req.id, {
      sortBy: "sort"
    });

    const result = data.map((item) => ({
      ...item,
      icon: !item.icon ? "https://placehold.jp/50x50.png" : `./images/Icon/${item.icon}`,
      updateDate: new Date(item.updateDate).toLocaleString("zh-TW")
    }));

    return {
      returnCode: 200,
      returnMsg: "success",
      returnData: { data: result },
      js: "table"
    };
  }
};