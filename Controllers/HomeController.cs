using Backstage.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Diagnostics;

namespace Backstage.Controllers {
    public class HomeController:Controller {
        private readonly IDbConnection dbConnection;
        private readonly ILogger<HomeController> _logger;

        public HomeController(IDbConnection dbConnection, ILogger<HomeController> logger) {
            this.dbConnection = dbConnection;
            _logger = logger;
        }

        public IActionResult Index() {
            string sql = "select * from ACLObject where Status=1 and InDesktop=1 order by Sort;";
            var data = dbConnection.Query<ACLObject>(sql).ToList();
            data.ForEach(a => a.Icon = string.IsNullOrWhiteSpace(a.Icon)? "https://placehold.jp/50x50.png" : $"~/images/Icon/{a.Icon}");

            return View(data);
        }


        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        [HttpGet]
        [HttpPost]
        public IActionResult Error() {
            if (HttpContext.Request.Method == "POST") {
                ViewData["Layout"] = "~/Views/Shared/_WindowLayout.cshtml";
            } else {
                ViewData["Layout"] = "~/Views/Shared/_Layout.cshtml";
            }

            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
