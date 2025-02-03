using Backstage.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace Backstage.ViewComponents {
    public class SettingAsideViewComponent : ViewComponent {
        private readonly IDbConnection dbConnection;
        public SettingAsideViewComponent(IDbConnection dbConnection) {
            this.dbConnection = dbConnection;
        }

        public async Task<IViewComponentResult> InvokeAsync(Guid id, Guid parentId) {
            List<ACLObject> data = new List<ACLObject>();
            try {
                string sql = @"with Tree as (
                            	select ID,ParentID,Name,Directions,ExecuteURL,Icon,Sort from ACLObject where ParentID=@ParentID and Status=1
                            	union all
                            	select a.ID,a.ParentID,a.Name,a.Directions,a.ExecuteURL,a.Icon,a.Sort from ACLObject a join Tree t on a.ID=t.ParentID where a.Status=1
                            )
                            
                            select * from (
                                select ID,ParentID,Name,Directions,ExecuteURL,Icon,Sort from ACLObject where ParentID=@ParentID and Status=1
                                union all
                                SELECT DISTINCT * FROM Tree WHERE ParentID IS NULL
                            ) a order by a.ParentID,a.Sort;";
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("ParentID", parentId);
                var result = await dbConnection.QueryAsync<ACLObject>(sql, parameters);
                foreach (var item in result) {
                    if (item.ParentID == null) {
                        item.Icon = "<i class=\"icofont-home\"></i>";
                        item.Name = "首頁";
                    } else {
                        item.Icon = string.IsNullOrWhiteSpace(item.Icon) ? "https://placehold.jp/48x48.png" : $"~/images/Icon/{item.Icon}";
                        item.IsCurrent = item.ID == id;
                    }
                }
                data = result.ToList();
            } catch {
            }

            return View("Default", data);
        }
    }
}
