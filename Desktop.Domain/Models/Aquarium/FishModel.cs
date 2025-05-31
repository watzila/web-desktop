namespace Desktop.Domain.Models {
    public class FishModel {
        public List<Items> Data { get; set; }

        public class Items {
            public Guid ID { get; set; }
            public string Name { get; set; }
        }

    }
}
