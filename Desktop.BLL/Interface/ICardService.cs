using Desktop.Domain.Models;

namespace Desktop.BLL.Interface {
	public interface ICardService {
		List<CardModel> GetList ( );
		CardModel GetCard ( CardParamModel.GetCard value );
		void CreateCard ( CardParamModel.Item value );
	}
}
