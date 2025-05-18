import Ajax from "../js/component/ajax.js";
import TemplateEngine from "../js/component/TemplateEngine.js";

//取得桌面功能按鈕
Ajax.conn({
    type: "get", url: "/api/Home/DesktopList", fn: async (res) => {
        //console.log(res);
        const html = await TemplateEngine.view("./templates/home.html", res.returnData);
        document.querySelector("#desktop>main").innerHTML = html;
        import("../js/desktop.js");
    }
});

//取得天氣
Ajax.conn({
    type: "get", url: "/api/Home/Weather", data: { locationId: "F-D0047-075", locationName: "太平區" }, fn: async (res) => {
        //console.log(res);
        const html = await TemplateEngine.view("./templates/weather.html", res.returnData);
        document.querySelector("#desktop>nav>.weather").innerHTML = html;
    }
});