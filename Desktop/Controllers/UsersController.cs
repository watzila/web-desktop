using Microsoft.AspNetCore.Mvc;
using Desktop.Domain.Models;
using Desktop.BLL.Interface;
using Desktop.BLL.Service;
using Desktop.Domain;

namespace Desktop.Controllers {
    //[Authorize]
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class UsersController(IUsersService usersService) : BaseController {

        [HttpPost("List")]
        public IActionResult List([FromBody] WindowInfoParamModel param) {
            ResultModel<Task<UsersModel>> result;
            try {
                Task<UsersModel> usersModel = usersService.List(param);
                result = new ResultModel<Task<UsersModel>>(usersModel);
            } catch (Exception ex) {
                result = new ResultModel<Task<UsersModel>>(ex);
            }
            return result;
        }

        [HttpPost("Info")]
        public IActionResult Info([FromBody] WindowInfoParamModel param) {
            ResultModel<UsersModel> result;

            try {
                UsersModel usersModel = usersService.Info(param);
                result = new ResultModel<UsersModel>(usersModel);
            } catch (Exception ex) {
                result = new ResultModel<UsersModel>(ex);
            }
            return result;
        }

    }
}
