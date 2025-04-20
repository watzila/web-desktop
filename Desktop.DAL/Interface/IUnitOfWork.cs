using System.Data;

namespace Desktop.DAL.Interface {
    public interface IUnitOfWork {
        IDbConnection CreateConnection();
    }
}
