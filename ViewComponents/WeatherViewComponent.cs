using Backstage.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace Backstage.ViewComponents {
    public class WeatherViewComponent:ViewComponent {
        public async Task<IViewComponentResult> InvokeAsync(string locationId, string locationName) {
            Weather.DeskTopTool data = new Weather.DeskTopTool();

            try {
                //建立http連線
                using(HttpClient c = new HttpClient()) {
                    //基底網址uri
                    c.BaseAddress = new Uri("https://opendata.cwa.gov.tw");
                    //get，回傳HttpResponseMessage
                    var response = await c.GetAsync($"/api/v1/rest/datastore/{locationId}?Authorization=CWB-422B0FA3-E374-492D-B54A-4D8942BE2B7E&format=JSON");
                    //以非同步作業方式將HTTP內容序列化為字串，回傳字串
                    string result = response.Content.ReadAsStringAsync().Result;
                    //將JSON格式轉換成物件並放入Models.Weather
                    var w = JsonConvert.DeserializeObject<Weather>(result);
                    Weather.Location locationInfo = w.records.locations[0].location.SingleOrDefault(a => a.locationName.Equals(locationName));

                    if(locationInfo != null) {
                        data.Temperature = locationInfo.weatherElement[1].time[0].elementValue[0].value;
                        string measures = locationInfo.weatherElement[1].time[0].elementValue[0].measures;
                        if(measures == "攝氏度") {
                            data.Temperature += "°C";
                        } else if(measures == "華氏度") {
                            data.Temperature += "°F";
                        }

                        int wxV = int.Parse(locationInfo.weatherElement[6].time[0].elementValue[1].value);
                        switch(wxV) {
                            case 1:
                            case 2:
                            case 3:
                            case 4:
                            case 5:
                            case 6:
                            case 24:
                            case 25:
                            case 26:
                            case 27:
                            case 28:
                            data.WeatherIMG = "~/images/sunIMG.svg";
                            break;

                            case 7:
                            case 8:
                            case 9:
                            case 10:
                            data.WeatherIMG = "~/images/cloudIMG.svg";
                            break;

                            case 42:
                            data.WeatherIMG = "~/images/snowIMG.svg";
                            break;

                            default:
                            data.WeatherIMG = "~/images/rainIMG.svg";
                            break;
                        }
                    }
                }
            } catch {

            }

            return View("Default",data);
        }
    }
}
