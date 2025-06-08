namespace Desktop.Domain.Models {
    public class ACLObjectModel {
        public List<Items> Data { get; set; }

        public class Items {
            public Guid ID { get; set; }//ID
            public Guid? ParentID { get; set; }//所屬層ID
            public string Name { get; set; }//名稱
            public string Directions { get; set; }
            public string ExecuteURL { get; set; }//執行地址
            public int Type { get; set; }//類型
            public string TypeText { get; set; }//類型
            public string Icon { get; set; }//圖標
            public string DefaultIcon { get; set; }//預設圖標
            public string UpdateDate { get; set; }
            public double? Width { get; set; }
            public double? Height { get; set; }
            public string Pos { get; set; }//位置
            public int? X { get; set; }
            public int? Y { get; set; }
            public int? H { get; set; }
            public int? W { get; set; }
            public bool IsCurrent { get; set; }
        }

    }
}
