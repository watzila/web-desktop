using Desktop.BLL.Interface;
using Desktop.Domain;
using Desktop.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace Desktop.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class SettingController(ISettingService settingService) : BaseController {
        [HttpPost("List")]
        public IActionResult List([FromBody] WindowInfoParamModel param) {
            ResultModel<ACLObjectModel> result;

            try {
                ACLObjectModel aclObjectModel = settingService.List(param);
                result = new ResultModel<ACLObjectModel>(aclObjectModel);
            } catch (Exception ex) {
                result = new ResultModel<ACLObjectModel>(ex);
            }

            return result;
        }
    }
}
