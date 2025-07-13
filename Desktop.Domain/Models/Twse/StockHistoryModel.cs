namespace Desktop.Domain.Models {
    public class StockHistoryModel {
        public string stat { get; set; }
        public string date { get; set; }
        public string title { get; set; }
        public string[] fields { get; set; }
        public string[][] data { get; set; }
        public string[] notes { get; set; }
        public int total { get; set; }
    }
}
