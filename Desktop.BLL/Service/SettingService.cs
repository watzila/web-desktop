using AutoMapper;
using Dapper;
using Desktop.BLL.Interface;
using Desktop.DAL.Interface;
using Desktop.Domain.Models;
using Desktop.Models.Contexts;

namespace Desktop.BLL.Service {
    public class SettingService(IUnitOfWork unitOfWork, IMapper mapper) : ISettingService {
        public ACLObjectModel List(WindowInfoParamModel param) {
            ACLObjectModel result = new ACLObjectModel();

            using (var connection = unitOfWork.CreateConnection()) {
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("@ParentID", param.Id);
                string sql = "select * from ACLObject where ParentID=@ParentID and Status=1 order by Sort;";
                var data = connection.Query<ACLObject>(sql, parameters);
                foreach (var item in data) {
                    item.Icon = string.IsNullOrWhiteSpace(item.Icon) ? "https://placehold.jp/48x48.png" : $"/images/Icon/{item.Icon}";
                }
                result.Data = mapper.Map<List<ACLObjectModel.Items>>(data);
            }

            return result;
        }
    }
}
