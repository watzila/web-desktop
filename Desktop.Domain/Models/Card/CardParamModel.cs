namespace Desktop.Domain.Models {
    public class CardParamModel {

		public class GetCard {
			public int Id { get; set; }
		}

		public class Item {
			/// <summary>
			/// 名稱
			/// </summary>
			public string Name { get; set; }
			/// <summary>
			/// 說明
			/// </summary>
			public string Description { get; set; }
			/// <summary>
			/// 攻擊
			/// </summary>
			public int Attack { get; set; }
			/// <summary>
			/// 生命
			/// </summary>
			public int Health { get; set; }
			/// <summary>
			/// 費用
			/// </summary>
			public int Cost { get; set; }
		}
	}
}
