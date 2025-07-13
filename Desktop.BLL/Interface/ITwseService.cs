using Desktop.Domain.Models;

namespace Desktop.BLL.Interface {
    public interface ITwseService {
        Task<TrendAnalysisResultModel> StockAsync(WindowInfoParamModel param);

    }
}
