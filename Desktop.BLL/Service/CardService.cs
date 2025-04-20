using AutoMapper;
using Dapper;
using Desktop.BLL.Interface;
using Desktop.DAL.Interface;
using Desktop.Domain.Models;
using Desktop.Models.Contexts;

namespace Desktop.BLL.Service {
    public class CardService : ICardService {
        private readonly IMapper mapper;
        private readonly IUnitOfWork unitOfWork;

        public CardService (IUnitOfWork unitOfWork, IMapper mapper ) {
            this.unitOfWork = unitOfWork;
            this.mapper = mapper;
		}

		public List<CardModel> GetList ( ) {
			List<CardModel> result;

			using (var connection = unitOfWork.CreateConnection()) {
				string sql = "SELECT * FROM Card";
				var data = connection.Query<Card>(sql);
				result = mapper.Map<List<CardModel>>(data);
            }

			return result;
		}

		public CardModel GetCard ( CardParamModel.GetCard value ) {
			CardModel result = new CardModel ( );

			using (var connection = unitOfWork.CreateConnection()) {
				DynamicParameters parameters = new DynamicParameters();
				parameters.Add("Id", value.Id);
				string sql = "SELECT * FROM Card WHERE Id = @Id";
                Card data = connection.Query<Card>(sql, parameters).SingleOrDefault();

				if (data != null) {
					result = mapper.Map<CardModel>(data);
				}
			}

			return result;
		}

		public void CreateCard ( CardParamModel.Item value ) {
            Card map = mapper.Map<Card> (value);

            using (var connection = unitOfWork.CreateConnection()) {
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("Name", map.Name);
                parameters.Add("Description", map.Description);
                parameters.Add("Attack", map.Attack);
                parameters.Add("Health", map.Health);
                parameters.Add("Cost", map.Cost);
                string sql = "INSERT INTO Card (Name, Description, Attack, Health, Cost) VALUES (@Name, @Description, @Attack, @Health, @Cost)";
                connection.Execute(sql, parameters);
            }

        }
	}
}
