using Backstage.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace Backstage.Controllers {
    public class SettingController:Controller {
        private readonly IDbConnection dbConnection;

        public SettingController(IDbConnection dbConnection) {
            this.dbConnection = dbConnection;
        }

        [HttpPost]
        public IActionResult Index([FromBody] WindowInfoParamModel paramModel) {
            TempData["title"] = paramModel?.Title;
            TempData["iconPath"] = paramModel?.IconPath;
            TempData["open"] = paramModel.Open;
            List<ACLObject> data = new List<ACLObject>();

            try {
                string sql = "select * from ACLObject where ParentID=@ParentID and Status=1 order by Sort;";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("ParentID", paramModel.Id);
                data = dbConnection.Query<ACLObject>(sql, parameters).ToList();
                data.ForEach(a => a.Icon = string.IsNullOrWhiteSpace(a.Icon) ? "https://placehold.jp/48x48.png" : $"~/images/Icon/{a.Icon}");
            } catch(Exception ex) {
                //log.ErrorMessage = ex.ToString();
            }

            return View(data);
        }
    }
}
