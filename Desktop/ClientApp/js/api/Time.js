export default {
  "/api/Time/Calendar": async (ctx) => {
    return {
      returnCode: 200,
      returnMsg: "success",
      returnData: { data: null },
      js: "calendar"
    };
  }

}