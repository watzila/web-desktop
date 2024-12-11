namespace Backstage.Models {
    public class ACLObject {
        public Guid ID { get; set; }//ID
        public Guid? ParentID { get; set; }//所屬層ID
        public string? Name { get; set; }//名稱
        public string? Directions { get; set; }
        public string? ExecuteURL { get; set; }//執行地址
        public int Type { get; set; }//類型
        public string? Icon { get; set; }//圖標
        public bool Status { get; set; }//狀態
        public bool InDesktop { get; set; }
        public bool IsSystem { get; set; }

        public bool IsCurrent { get; set; }
    }
}
