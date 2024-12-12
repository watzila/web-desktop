using Backstage.Models;
using Dapper;
using System.Data;
using System.Net;

namespace Backstage.Utility {
    public class ProjectShare {
        private readonly IDbConnection dbConnection;
        private readonly IConfiguration configuration;
        private readonly IHttpContextAccessor httpContextAccessor;

        public ProjectShare(IDbConnection dbConnection, IConfiguration configuration, IHttpContextAccessor httpContextAccessor) {
            this.dbConnection = dbConnection;
            this.configuration = configuration;
            this.httpContextAccessor = httpContextAccessor;
        }

        public Users IsLogin() {
            Users data = new Users();
            var context = httpContextAccessor.HttpContext;
            string cookieName = configuration["cookieName"];
            if (context == null || context.Request.Cookies[cookieName] == null) {
                data.Txt = "未登入";
            }

            if (!string.IsNullOrWhiteSpace(context.Request.Cookies[cookieName])) {
                DynamicParameters parameters = new DynamicParameters();
                string sql = "select u.ID,u.Name,u.ProfileIMG from Users u join Sessions s on s.UID=u.ID where s.ID=@ID;";
                parameters.Add("ID", context.Request.Cookies[cookieName]);

                var result = dbConnection.Query<Users>(sql, parameters).SingleOrDefault();

                if (result == null) {
                    data.Txt = "查無此人";
                } else {
                    data = result;
                    //UpdateSessionTime(conn);
                }
            } else {
                data.Txt = "操作逾時超過20分鐘";
            }
            return data;
        }

        /// <summary>
        /// 取得功能
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public ACLObject? GetACLObject(Guid id) {
            DynamicParameters parameters = new DynamicParameters();
            string sql = "select * from ACLObject where ID=@ID and Status=1;";
            parameters.Add("ID", id);

            ACLObject? data = dbConnection.Query<ACLObject>(sql, parameters).SingleOrDefault();

            return data;
        }

        /// <summary>
        /// 取得使用者IP
        /// </summary>
        /// <returns>IP</returns>
        public string GetClientIP() {
            var context = httpContextAccessor.HttpContext;
            var remoteIp = context.Connection.RemoteIpAddress;

            if (context.Request.Headers.ContainsKey("X-Forwarded-For")) {
                // 可能會有多個 IP 地址，以逗號分隔。你通常需要第一個 IP 地址。
                var forwardedFor = context.Request.Headers["X-Forwarded-For"].ToString().Split(',').First().Trim();
                if (IPAddress.TryParse(forwardedFor, out var ip)) {
                    remoteIp = ip;
                }
            } else if (context.Request.Headers.ContainsKey("X-Real-IP")) {
                var realIp = context.Request.Headers["X-Real-IP"].ToString();
                if (IPAddress.TryParse(realIp, out var ip)) {
                    remoteIp = ip;
                }
            }

            return remoteIp?.ToString() ?? "";
        }

        public string GetDefaultIcon(int type) {
            switch (type) {
                case 2:
                    return "<i class=\"icofont-file-alt\"></i>";
                default:
                    return "<i class=\"icofont-file-file\"></i>";
            }
        }

        public string GetTypeText(int type) {
            switch (type) {
                case 1:
                    return "資料夾";
                case 2:
                    return "文字文件";
                default:
                    return "檔案";
            }
        }

        public class MimeType {
            public const string TXT = "text/plain";
            public const string XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            public const string XLS = "application/vnd.ms-excel";
            public const string ODS = "application/vnd.oasis.opendocument.spreadsheet";
        }

    }
}
