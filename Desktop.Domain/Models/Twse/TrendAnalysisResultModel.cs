namespace Desktop.Domain.Models {
    public class TrendAnalysisResultModel {
        public List<StockDataModel> StockDatas { get; set; } = new List<StockDataModel>();
        public string Suggestion { get; set; }
    }
}
