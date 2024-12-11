using Backstage.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace Backstage.Controllers {
    public class FolderController : Controller {
        private readonly IDbConnection dbConnection;
        private readonly IHttpClientFactory httpClientFactory;
        private readonly IHttpContextAccessor httpContextAccessor;

        public FolderController(IDbConnection dbConnection, IHttpContextAccessor httpContextAccessor, IHttpClientFactory httpClientFactory) {
            this.dbConnection = dbConnection;
            this.httpClientFactory = httpClientFactory;
            this.httpContextAccessor = httpContextAccessor;
        }

        [HttpPost]
        public IActionResult Index([FromBody] WindowInfo windowInfo) {
            TempData["title"] = windowInfo?.Title;
            TempData["iconPath"] = windowInfo?.IconPath;
            TempData["open"] = windowInfo.Open;

            try {
                string sql = "select top 1 * from Files where ParentID=@ParentID and InDesktop=0 order by Sort;";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("ParentID", windowInfo.Id);
                Files result = dbConnection.Query<Files>(sql, parameters).SingleOrDefault();

            } catch (Exception ex) {
                //log.ErrorMessage = ex.ToString();
            }

            return View();
        }
    }
}
