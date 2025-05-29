export default {
    "/api/Home/DesktopList": async (ctx) => {
        const db = await ctx.getDBInstance();
        const data = await ctx.getStore(db, "ACLObject", (item) => item.status == 1 && item.inDesktop == 1, {
            sortBy: "sort"
        });

        const result = data.map((item) => ({
            ...item,
            icon: !item.icon ? "https://placehold.jp/50x50.png" : `./images/Icon/${item.icon}`
        }));

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: { data: result },
            js: null
        };
    },
    "/api/Home/Weather": async (ctx, data) => {
        //console.log(data);
        const result = {
            weather: "??",
            weatherIMG: "./images/sunIMG.svg",
            temperature: "0°C"
        };

        await fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/${data.locationId}?Authorization=CWB-422B0FA3-E374-492D-B54A-4D8942BE2B7E&format=JSON&LocationName=${data.locationName}`)
            .then(response => response.json())
            .then(res => {
                //console.log(res);
                try {
                    const locationInfo = res.records.Locations[0].Location[0];
                    if (locationInfo) {
                        result.temperature = locationInfo.WeatherElement.filter(a => a.ElementName == "平均溫度")[0].Time[0].ElementValue[0].Temperature + "°C";
                        const wxV = locationInfo.WeatherElement.filter(a => a.ElementName == "天氣現象")[0].Time[0].ElementValue[0];
                        result.weather = wxV.Weather;
                        const code = wxV.WeatherCode * 1;
                        switch (code) {
                            case 1:
                            case 2:
                            case 3:

                            case 24:
                            case 25:
                            case 26:
                            case 27:
                            case 28:
                                result.weatherIMG = "./images/sunIMG.svg";
                                break;

                            case 4:
                            case 5:
                            case 6:
                            case 7:
                                result.weatherIMG = "./images/cloudIMG.svg";
                                break;

                            case 42:
                                result.weatherIMG = "./images/snowIMG.svg";
                                break;

                            default:
                                result.weatherIMG = "./images/rainIMG.svg";
                                break;
                        }
                    }
                } catch {
                    throw new Error(JSON.stringify({ title: "天氣", msg: "✖讀取失敗" }));
                }
            });

        return {
            returnCode: 200,
            returnMsg: "success",
            returnData: result,
            js: null
        };
    }
};