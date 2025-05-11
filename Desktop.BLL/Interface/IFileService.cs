using Desktop.Domain.Models;

namespace Desktop.BLL.Interface {
    public interface IFileService {
        TextModel Text(WindowInfoParamModel param);
        void SaveText(TextParamModel param);

    }
}
