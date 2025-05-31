using AutoMapper;
using Dapper;
using Desktop.BLL.Interface;
using Desktop.DAL.Interface;
using Desktop.Domain.Models;
using Desktop.Models.Contexts;

namespace Desktop.BLL.Service {
    public class AquariumService(IUnitOfWork unitOfWork, IMapper mapper) :IAquariumService {
        public FishModel Index() {
            FishModel result = new FishModel();

            using (var connection = unitOfWork.CreateConnection()) {
                string sql = "select * from Fish order by Sort;";
                var data = connection.Query<Fish>(sql);
                result.Data = mapper.Map<List<FishModel.Items>>(data);
            }

            return result;
        }

    }
}
