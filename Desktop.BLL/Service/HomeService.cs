using AutoMapper;
using Dapper;
using Desktop.BLL.Interface;
using Desktop.DAL.Interface;
using Desktop.Domain.Models;
using Desktop.Models.Contexts;
using Newtonsoft.Json;

namespace Desktop.BLL.Service {
    public class HomeService(IUnitOfWork unitOfWork, IMapper mapper, IHttpClientFactory httpClientFactory) : IHomeService {
        public ACLObjectModel DesktopList() {
            ACLObjectModel result = new ACLObjectModel();

            using (var connection = unitOfWork.CreateConnection()) {
                string sql = "select * from ACLObject where Status=1 and InDesktop=1 order by Sort;";
                var data = connection.Query<ACLObject>(sql);
                foreach (var item in data) {
                    item.Icon = string.IsNullOrWhiteSpace(item.Icon) ? "https://placehold.jp/50x50.png" : $"./images/Icon/{item.Icon}";
                }
                result.Data = mapper.Map<List<ACLObjectModel.Items>>(data);
            }

            foreach(var item in result.Data) {
                if(!string.IsNullOrWhiteSpace(item.Pos)) {
                    string[] pos = item.Pos.Split(',');
                    item.X = int.TryParse(pos[0], out int x) ? x : 0;
                    item.Y = int.TryParse(pos[1], out int y) ? y : 0;
                    item.W = int.TryParse(pos[2], out int w) ? w : 0;
                    item.H = int.TryParse(pos[3], out int h) ? h : 0;
                }
            }

            return result;
        }

        public async Task<WeatherModel> Weather(string locationId, string locationName) {
            WeatherModel result = new WeatherModel();
            try {
                //建立http連線
                var c = httpClientFactory.CreateClient();
                //基底網址uri
                c.BaseAddress = new Uri("https://opendata.cwa.gov.tw");
                //get，回傳HttpResponseMessage
                var response = await c.GetAsync($"/api/v1/rest/datastore/{locationId}?Authorization=CWB-422B0FA3-E374-492D-B54A-4D8942BE2B7E&format=JSON&LocationName={locationName}");
                //以非同步作業方式將HTTP內容序列化為字串，回傳字串
                string data = response.Content.ReadAsStringAsync().Result;
                //將JSON格式轉換成物件並放入Models.Weather
                var w = JsonConvert.DeserializeObject<Weather>(data);
                Weather.Location locationInfo = w.records.Locations[0].Location.Single();

                if (locationInfo != null) {
                    result.Temperature = locationInfo.WeatherElement.Where(a => a.ElementName.Equals("平均溫度")).Single().Time[0].ElementValue[0].Temperature + "°C";
                    Weather.Elementvalue wxV = locationInfo.WeatherElement.Where(a => a.ElementName.Equals("天氣現象")).Single().Time[0].ElementValue[0];
                    result.Weather = wxV.Weather;
                    int code = int.Parse(wxV.WeatherCode);
                    switch (code) {
                        case 1:
                        case 2:
                        case 3:

                        case 24:
                        case 25:
                        case 26:
                        case 27:
                        case 28:
                            result.WeatherIMG = "./images/sunIMG.svg";
                            break;

                        case 4:
                        case 5:
                        case 6:
                        case 7:
                            result.WeatherIMG = "./images/cloudIMG.svg";
                            break;

                        case 42:
                            result.WeatherIMG = "./images/snowIMG.svg";
                            break;

                        default:
                            result.WeatherIMG = "./images/rainIMG.svg";
                            break;
                    }
                }
            } catch {

            }

            return result;
        }

    }
}
