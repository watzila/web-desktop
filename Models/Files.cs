namespace Backstage.Models {
    public class Files {
        public Guid ID { get; set; }//ID
        public Guid? ParentID { get; set; }//所屬層ID
        public Guid? InheritID { get; set; }//所屬層ID
        public string? Name { get; set; }//名稱
        public string? Content { get; set; }
        public int Type { get; set; }//類型
        public string? ExecuteURL { get; set; }//執行地址
        public string? Icon { get; set; }//圖標
        public bool InDesktop { get; set; }
    }
}
