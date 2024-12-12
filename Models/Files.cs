namespace Backstage.Models {
    public class Files {
        public Guid ID { get; set; }//ID
        public Guid? InheritID { get; set; }//繼承ID
        public string Name { get; set; }//名稱
        public string? Content { get; set; }
        public int Type { get; set; }//類型
        public DateTime UpdateDate { get; set; }

    }
}
