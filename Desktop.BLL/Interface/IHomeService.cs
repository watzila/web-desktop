using Desktop.Domain.Models;

namespace Desktop.BLL.Interface {
    public interface IHomeService {
        ACLObjectModel DesktopList();
        Task<WeatherModel> Weather(string locationId, string locationName);
    }
}
