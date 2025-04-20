using Desktop.Domain.Models;

namespace Desktop.BLL.Interface {
    public interface IUsersService {
        Task<UsersModel> List(WindowInfoParamModel param);
        UsersModel Info(WindowInfoParamModel param);
    }
}
