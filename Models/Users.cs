namespace Backstage.Models {
    public class Users {
        public Guid ID { get; set; }
        public string? Name { get; set; }
        public string? Account { get; set; }
        public string? Password { get; set; }
        public string? ProfileIMG { get; set; }

        public string? Txt { get; set; }
        public Guid? ACLObjectID { get; set; }
        public Guid? ACLObjectParentID { get; set; }
        public string? Title { get; set; }
    }
}
