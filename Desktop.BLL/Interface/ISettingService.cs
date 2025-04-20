using Desktop.Domain.Models;

namespace Desktop.BLL.Interface {
    public interface ISettingService {
        ACLObjectModel List(WindowInfoParamModel param);

    }
}
