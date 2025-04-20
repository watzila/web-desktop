using Desktop.BLL.Interface;
using Desktop.Domain;
using Desktop.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace Desktop.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class HomeController(IHomeService homeService) : BaseController {
        [HttpGet("DesktopList")]
        public IActionResult DesktopList() {
            ResultModel<ACLObjectModel> result;

            try {
                ACLObjectModel aclObjectModel = homeService.DesktopList();
                result = new ResultModel<ACLObjectModel>(aclObjectModel);
            } catch (Exception ex) {
                result = new ResultModel<ACLObjectModel>(ex);
            }
            return result;
        }

        [HttpGet("Weather")]
        public async Task<IActionResult> Weather(string locationId, string locationName) {
            ResultModel<WeatherModel> result;

            try {
                WeatherModel weatherModel = await homeService.Weather(locationId, locationName);
                result = new ResultModel<WeatherModel>(weatherModel);
            } catch (Exception ex) {
                result = new ResultModel<WeatherModel>(ex);
            }
            return result;
        }

    }
}
