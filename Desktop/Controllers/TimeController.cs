using Desktop.BLL.Interface;
using Desktop.Domain;
using Desktop.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace Desktop.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class TimeController() : BaseController {
        [HttpPost("Calendar")]
        public IActionResult Calendar([FromBody] WindowInfoParamModel param) {
            ResultModel<string> result;

            try {
                result = new ResultModel<string>(null, "calendar");
            } catch (Exception ex) {
                result = new ResultModel<string>(ex);
            }

            return result;
        }
    }
}
