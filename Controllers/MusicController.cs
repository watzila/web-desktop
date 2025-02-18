using Backstage.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace Backstage.Controllers {
    public class MusicController : Controller {
        private readonly IDbConnection dbConnection;

        public MusicController(IDbConnection dbConnection) {
            this.dbConnection = dbConnection;
        }

        [HttpPost]
        public IActionResult Index([FromBody] WindowInfoParamModel paramModel) {
            TempData["title"] = paramModel.Title;
            TempData["iconPath"] = paramModel.IconPath;
            TempData["open"] = paramModel.Open;
            TempData["js"] = "Music";
            TempData["w"] = paramModel.Width;
            TempData["h"] = paramModel.Height;

            return View();
        }
    }
}
