using Microsoft.Extensions.Configuration;
using System.Text;

namespace Desktop.BLL {
    public class ProjectShare(IHttpClientFactory httpClientFactory, IConfiguration configuration) {
        public string GetDefaultIcon(int type) {
            switch (type) {
                case 2:
                    return "<i class=\"icofont-file-alt\" data-icon=\"icon\"></i>";
                default:
                    return "<i class=\"icofont-file-file\" data-icon=\"icon\"></i>";
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

        public async Task<HttpResponseMessage> ApiConnect(string url, string json = "", bool useCurrentRequestHost = true) {
            var c = httpClientFactory.CreateClient();
            if (useCurrentRequestHost) {
                c.BaseAddress = new Uri(configuration["BaseUrl"]);
            }
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            return await c.PostAsync(url, content);
        }

    }
}
