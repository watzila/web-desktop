using AutoMapper;
using Dapper;
using Desktop.BLL.Interface;
using Desktop.DAL.Interface;
using Desktop.Domain.Models;
using Desktop.Models.Contexts;

namespace Desktop.BLL.Service {
    public class FileService(IUnitOfWork unitOfWork, IMapper mapper) : IFileService {
        public TextModel Text(WindowInfoParamModel param) {
            TextModel result = new TextModel();

            using (var connection = unitOfWork.CreateConnection()) {
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("@ID", param.Id);
                string sql = "select * from Files where ID=@ID";
                var data = connection.Query<Files>(sql, parameters).SingleOrDefault();
                result = mapper.Map<TextModel>(data);
            }

            return result;
        }

        public void SaveText(TextParamModel param) {
            using (var connection = unitOfWork.CreateConnection()) {
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("@ID", param.ID);
                parameters.Add("@Content", param.Content);
                string sql = "update Files set Content=@Content where ID=@ID";
                connection.Execute(sql, parameters);
            }
        }
    }
}
