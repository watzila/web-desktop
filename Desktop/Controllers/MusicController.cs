using Desktop.BLL.Interface;
using Desktop.Domain;
using Desktop.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace Desktop.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class MusicController(IMusicService musicService) : BaseController {
        [HttpPost("List")]
        public IActionResult List() {
            ResultModel<MusicModel> result;

            try {
                MusicModel musicModel = musicService.List();
                result = new ResultModel<MusicModel>(musicModel, "Music");
            } catch (Exception ex) {
                result = new ResultModel<MusicModel>(ex);
            }
            return result;
        }

        [HttpPost("Add")]
        public IActionResult Add([FromBody] MusicParamModel param) {
            ResultModel<Guid> result;

            try {
                Guid id = musicService.Add(param);
                result = new ResultModel<Guid>(id);
            } catch (Exception ex) {
                result = new ResultModel<Guid>(ex);
            }
            return result;
        }

        [HttpPost("Delete")]
        public IActionResult Delete([FromBody] WindowInfoParamModel param) {
            ResultModel<string> result;

            try {
                musicService.Delete(param);
                result = new ResultModel<string>(string.Empty);
            } catch (Exception ex) {
                result = new ResultModel<string>(ex);
            }
            return result;
        }

    }
}
