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
                    var response = await c.GetAsync($"/api/v1/rest/datastore/{locationId}?Authorization=CWB-422B0FA3-E374-492D-B54A-4D8942BE2B7E&format=JSON&LocationName={locationName}");
                    //以非同步作業方式將HTTP內容序列化為字串，回傳字串
                    string result = response.Content.ReadAsStringAsync().Result;
                    //將JSON格式轉換成物件並放入Models.Weather
                    var w = JsonConvert.DeserializeObject<Weather>(result);
                    Weather.Location locationInfo = w.records.Locations[0].Location.Single();

                    if(locationInfo != null) {
                        data.Temperature = locationInfo.WeatherElement.Where(a => a.ElementName.Equals("平均溫度")).Single().Time[0].ElementValue[0].Temperature + "°C";
                        Weather.Elementvalue wxV = locationInfo.WeatherElement.Where(a => a.ElementName.Equals("天氣現象")).Single().Time[0].ElementValue[0];
                        data.Weather = wxV.Weather;
                        int code = int.Parse(wxV.WeatherCode);
                        switch(code) {
                            case 1:
                            case 2:
                            case 3:
                            
                            case 24:
                            case 25:
                            case 26:
                            case 27:
                            case 28:
                            data.WeatherIMG = "~/images/sunIMG.svg";
                            break;

                            case 4:
                            case 5:
                            case 6:
                            case 7:
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
