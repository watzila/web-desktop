using Desktop.Domain.Models;

namespace Desktop.BLL.Interface {
    public interface IMusicService {
        MusicModel List();
        void Delete(WindowInfoParamModel param);
        Guid Add(MusicParamModel param);
    }
}
