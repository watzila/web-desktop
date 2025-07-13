using Desktop.BLL.Interface;
using Desktop.Domain;
using Desktop.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace Desktop.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class TwseController(ITwseService twseService) : BaseController {
        [HttpPost("Index")]
        public IActionResult Index() {
            ResultModel<string> result;

            try {
                result = new ResultModel<string>(null, "twse");
            } catch (Exception ex) {
                result = new ResultModel<string>(ex);
            }

            return result;
        }

        [HttpPost("Stock")]
        public async Task<IActionResult> Stock([FromBody] WindowInfoParamModel param) {
            ResultModel<TrendAnalysisResultModel> result;
            try {
                TrendAnalysisResultModel trendAnalysisResultModel = await twseService.StockAsync(param);
                result = new ResultModel<TrendAnalysisResultModel>(trendAnalysisResultModel);
            } catch (Exception ex) {
                result = new ResultModel<TrendAnalysisResultModel>(ex);
            }
            return result;
        }

    }
}
