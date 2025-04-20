namespace Desktop.Domain.Models {
    public class MusicModel {
        public List<Items> Data { get; set; }

        public class Items {
            public Guid ID { get; set; }
            public string Name { get; set; }
            public string Path { get; set; }
            public string Source { get; set; }
        }

    }
}
