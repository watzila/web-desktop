using Backstage.Models;
using Backstage.Utility;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Data;

namespace Backstage.Controllers {
    public class FolderController : Controller {
        private readonly IDbConnection dbConnection;
        private readonly IHttpClientFactory httpClientFactory;
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly ProjectShare share;

        public FolderController(IDbConnection dbConnection, IHttpContextAccessor httpContextAccessor, IHttpClientFactory httpClientFactory, ProjectShare share) {
            this.dbConnection = dbConnection;
            this.httpClientFactory = httpClientFactory;
            this.httpContextAccessor = httpContextAccessor;
            this.share = share;
        }

        [HttpPost]
        public IActionResult Index([FromBody] WindowInfo windowInfo) {
            TempData["title"] = windowInfo?.Title;
            TempData["iconPath"] = windowInfo?.IconPath;
            TempData["open"] = windowInfo.Open;
            List<ACLObject> data = new List<ACLObject>();

            try {
                string sql = "select * from ACLObject where ParentID=@ParentID and InDesktop=0 order by Sort;";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("ParentID", windowInfo.Id);
                var result = dbConnection.Query<ACLObject>(sql, parameters);
                foreach (var item in result) {
                    if (string.IsNullOrWhiteSpace(item.Icon)) {
                        item.DefaultIcon = share.GetDefaultIcon(item.Type);
                        item.TypeText = share.GetTypeText(item.Type);
                    }
                }

                data = result.ToList();
            } catch (Exception ex) {
                //log.ErrorMessage = ex.ToString();
            }

            return View(data);
        }
    }
}
