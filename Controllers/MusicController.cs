using Backstage.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace Backstage.Controllers {
    public class MusicController:Controller {
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
            if(paramModel.Width.HasValue) {
                TempData["w"] = paramModel.Width.Value;
            }
            if(paramModel.Height.HasValue) {
                TempData["h"] = paramModel.Height;
            }

            List<Music> data = new List<Music>();

            try {
                string sql = "select * from Music order by Sort;";
                var result = dbConnection.Query<Music>(sql);

                data = result.ToList();
            } catch(Exception ex) {
                //log.ErrorMessage = ex.ToString();
            }

            return View(data);
        }
    }
}
