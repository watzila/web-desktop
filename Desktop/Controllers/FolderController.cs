using Desktop.BLL.Interface;
using Desktop.Domain;
using Desktop.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace Desktop.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class FolderController(IFolderService folderService) : BaseController {
        [HttpPost("List")]
        public IActionResult List([FromBody] WindowInfoParamModel param) {
            ResultModel<ACLObjectModel> result;

            try {
                ACLObjectModel aclObjectModel = folderService.List(param);
                result = new ResultModel<ACLObjectModel>(aclObjectModel, "Table");
            } catch (Exception ex) {
                result = new ResultModel<ACLObjectModel>(ex);
            }

            return result;
        }
    }
}
