using Desktop.Domain.Models;

namespace Desktop.BLL.Interface {
    public interface IFolderService {
        ACLObjectModel List(WindowInfoParamModel param);

    }
}
