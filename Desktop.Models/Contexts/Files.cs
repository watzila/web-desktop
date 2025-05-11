namespace Desktop.Models.Contexts {
    public class Files {
        public Guid ID { get; set; }
        public Guid? InheritId { get; set; }
        public string Content { get; set; }
        public byte Type { get; set; }
    }
}
