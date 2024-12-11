using System.ComponentModel.DataAnnotations;

namespace Backstage.Models {
    public class LoginParamModel {
        [Required(ErrorMessage = "請輸入帳號")]
        [StringLength(10, ErrorMessage = "帳號不可超過10字元")]
        public string? Account { get; set; }
        [Required(ErrorMessage = "請輸入密碼")]
        [StringLength(10, ErrorMessage = "密碼不可超過10字元")]
        public string? Password { get; set; }
    }
}
