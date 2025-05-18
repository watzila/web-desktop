using AutoMapper;
using Dapper;
using Desktop.BLL.Interface;
using Desktop.DAL.Interface;
using Desktop.Domain.Models;
using Desktop.Models.Contexts;

namespace Desktop.BLL.Service {
    public class FolderService(IUnitOfWork unitOfWork, IMapper mapper, ProjectShare share) : IFolderService {
        public ACLObjectModel List(WindowInfoParamModel param) {
            ACLObjectModel result = new ACLObjectModel();

            using (var connection = unitOfWork.CreateConnection()) {
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("@ParentID", param.Id);
                string sql = "select * from ACLObject where ParentID=@ParentID and InDesktop=0 order by Sort;";
                var data = connection.Query<ACLObject>(sql, parameters);
                foreach (var item in data) {
                    item.TypeText = share.GetTypeText(item.Type);
                    if (string.IsNullOrWhiteSpace(item.Icon)) {
                        item.DefaultIcon = share.GetDefaultIcon(item.Type);
                    } else {
                        item.Icon = $"./images/Icon/{item.Icon}";
                    }
                }
                result.Data = mapper.Map<List<ACLObjectModel.Items>>(data);
            }

            return result;
        }
    }
}
