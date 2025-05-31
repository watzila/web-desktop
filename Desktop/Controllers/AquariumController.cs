using Desktop.Domain.Models;
using Desktop.Domain;
using Microsoft.AspNetCore.Mvc;
using Desktop.BLL.Interface;

namespace Desktop.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class AquariumController(IAquariumService aquariumService):BaseController {
        [HttpPost("Index")]
        public IActionResult Index() {
            ResultModel<FishModel> result;

            try {
                FishModel fishModel = aquariumService.Index();
                result = new ResultModel<FishModel>(fishModel, "aquarium");
            } catch(Exception ex) {
                result = new ResultModel<FishModel>(ex);
            }
            return result;
        }
    }
}
