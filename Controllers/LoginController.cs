using Backstage.Models;
using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Backstage.Utility;

namespace Backstage.Controllers {
    public class LoginController:Controller {
        IDbConnection dbConnection;
        IConfiguration configuration;
        ProjectShare share;
        public LoginController(IDbConnection dbConnection, IConfiguration configuration,ProjectShare share) {
            this.dbConnection = dbConnection;
            this.configuration = configuration;
            this.share = share;
        }

        public IActionResult Index() {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Index(LoginParamModel data) {
            if(!ModelState.IsValid) {
                return View(data);
            }
            string sql = "select * from Users where Account=@Account and Password=@Password;";
            DynamicParameters parameters = new DynamicParameters();
            parameters.Add("Account", data.Account);
            parameters.Add("Password", data.Password);

            try {
                var result = dbConnection.Query<Users>(sql, parameters).SingleOrDefault();
                if(result == null) {
                    TempData["err"] = "帳號或密碼錯誤!";
                    return View(data);
                }

                string sessionID = Guid.NewGuid().ToString();
                sql = @"if exists (select 1 from Sessions where UID=@UID)
									update Sessions set ID=@ID,CreateDate=@CreateDate,IP=@IP where UID=@UID
									else
									insert into Sessions (UID,ID,CreateDate,IP) values(@UID,@ID,@CreateDate,@IP);";
                parameters.Add("UID", result.ID.ToString());
                parameters.Add("ID", sessionID);
                parameters.Add("CreateDate", DateTime.Now);
                parameters.Add("IP", share.GetClientIP());
                dbConnection.Execute(sql, parameters);

                var claims = new List<Claim> {
                        new  Claim ("ID",sessionID),
                        new Claim (ClaimTypes.Role,"Admin")
                    };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity));
                return Redirect($"{configuration["BaseRouter"]}Home");

            } catch(Exception ex) {
                TempData["err"] = ex.Message;
                return View(data);
            }
        }

        [HttpPost]
        public IActionResult Out() {
            HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToRoute("Login");
        }

    }
}
