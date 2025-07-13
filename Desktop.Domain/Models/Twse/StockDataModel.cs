namespace Desktop.Domain.Models {
    public class StockDataModel {
        public DateTime Date { get; set; }
        public decimal Open { get; set; }
        public decimal High { get; set; }
        public decimal Low { get; set; }
        public decimal Close { get; set; }
        public long Volume { get; set; }
        public decimal? MA5 { get; set; } // 5日移動平均線
        public decimal? MA20 { get; set; } // 20日移動平均線
        public decimal? RSI { get; set; }
        public decimal? EMA12 { get; set; }
        public decimal? EMA26 { get; set; }
        public decimal? DIF { get; set; }
        public decimal? MACD { get; set; } // 又稱 DEA
        public decimal? OSC { get; set; }  // 柱狀圖 (DIF - MACD)
    }
}
