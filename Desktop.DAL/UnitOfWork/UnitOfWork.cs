using Desktop.DAL.Interface;
using System.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;

namespace Desktop.DAL.UnitOfWork {
    public class UnitOfWork : IUnitOfWork {
        private readonly string connectionString;
        public UnitOfWork(IConfiguration configuration) {
            this.connectionString = configuration.GetConnectionString("dbTest");
        }

        public IDbConnection CreateConnection() {
            return new SqlConnection(connectionString);
        }
    }
}
