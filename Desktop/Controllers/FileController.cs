using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Desktop.BLL.Interface;
using Desktop.BLL.Service;
using Desktop.Domain.Models;
using Desktop.Domain;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Desktop.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class FileController(IFileService fileService): BaseController {
        [HttpPost("Text")]
        public IActionResult Text([FromBody] WindowInfoParamModel param) {
            ResultModel<TextModel> result;

            try {
                TextModel textModel = fileService.Text(param);
                result = new ResultModel<TextModel>(textModel, "text");
            } catch (Exception ex) {
                result = new ResultModel<TextModel>(ex);
            }

            return result;
        }

        [HttpPost("SaveText")]
        public IActionResult SaveText([FromForm] TextParamModel param) {
            ResultModel<string> result;

            try {
                fileService.SaveText(param);
                result = new ResultModel<string>(string.Empty);
            } catch (Exception ex) {
                result = new ResultModel<string>(ex);
            }

            return result;
        }

    }
}
