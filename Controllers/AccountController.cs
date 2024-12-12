using Backstage.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using Newtonsoft.Json;
using System.Text;

namespace Backstage.Controllers {
    public class AccountController : Controller {
        private readonly IDbConnection dbConnection;
        private readonly IHttpClientFactory httpClientFactory;
        private readonly IHttpContextAccessor httpContextAccessor;

        public AccountController(IDbConnection dbConnection, IHttpContextAccessor httpContextAccessor, IHttpClientFactory httpClientFactory) {
            this.dbConnection = dbConnection;
            this.httpClientFactory = httpClientFactory;
            this.httpContextAccessor = httpContextAccessor;
        }

        [HttpPost]
        public async Task<IActionResult?> Index([FromBody] WindowInfo windowInfo) {
            try {
                string sql = "select top 1 * from ACLObject where ParentID=@ParentID and Status=1 order by Sort;";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("ParentID", windowInfo.Id);
                ACLObject? result = dbConnection.Query<ACLObject>(sql, parameters).SingleOrDefault();
                if (result != null) {
                    var c = httpClientFactory.CreateClient();
                    c.BaseAddress = new Uri($"{httpContextAccessor.HttpContext.Request.Scheme}://{httpContextAccessor.HttpContext.Request.Host}");
                    var content = new StringContent(JsonConvert.SerializeObject(new { result.ID }), Encoding.UTF8, "application/json");
                    var response = await c.PostAsync(result.ExecuteURL, content);
                    if (response.IsSuccessStatusCode) {
                        var data = await response.Content.ReadAsStringAsync();
                        return Content(data, "text/html");
                    }
                    TempData["open"] = windowInfo.Open;
                }
            } catch (Exception ex) {
                //log.ErrorMessage = ex.ToString();
            }

            return null;
        }

        [HttpPost]
        public IActionResult Info([FromBody] WindowInfo windowInfo) {
            Users data = new Users();

            try {
                string sql = "select * from ACLObject where ID=@ID and Status=1;";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("ID", windowInfo.Id);
                ACLObject? result = dbConnection.Query<ACLObject>(sql, parameters).SingleOrDefault();
                if (result != null) {
                    data.ACLObjectID = result.ID;
                    data.ACLObjectParentID = result.ParentID;
                    data.Title = result.Name;
                    data.Name = "名子";
                    data.ProfileIMG = "https://placehold.jp/200x200.png";
                }
            } catch (Exception ex) {
                //log.ErrorMessage = ex.ToString();
            }

            TempData["open"] = "_self";
            return View(data);
        }

        [HttpPost]
        public IActionResult Login([FromBody] WindowInfo windowInfo) {
            Users data = new Users();

            try {
                string sql = "select * from ACLObject where ID=@ID and Status=1;";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("ID", windowInfo.Id);
                ACLObject? result = dbConnection.Query<ACLObject>(sql, parameters).SingleOrDefault();
                if (result != null) {
                    data.ACLObjectID = result.ID;
                    data.ACLObjectParentID = result.ParentID;
                    data.Title = result.Name;
                }
            } catch (Exception ex) {
                //log.ErrorMessage = ex.ToString();
            }

            TempData["open"] = "_self";
            return View(data);
        }
    }
}
