namespace Backstage.Models {
    public class WindowInfoParamModel {
        public string? Title { get; set; }
        public string? IconPath { get; set; }
        public string? Id { get; set; }
        public string Open { get; set; } = "_self";
        public double? Width { get; set; }
        public double? Height { get; set; }
    }
}
