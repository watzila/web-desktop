using AutoMapper;
using Dapper;
using Desktop.BLL.Interface;
using Desktop.DAL.Interface;
using Desktop.Domain.Models;
using Desktop.Models.Contexts;
using Microsoft.VisualBasic;

namespace Desktop.BLL.Service {
    public class MusicService(IUnitOfWork unitOfWork, IMapper mapper) : IMusicService {
        public MusicModel List() {
            MusicModel result = new MusicModel();

            using (var connection = unitOfWork.CreateConnection()) {
                string sql = "select * from Music order by Sort;";
                var data = connection.Query<Music>(sql);
                result.Data = mapper.Map<List<MusicModel.Items>>(data);
            }

            return result;
        }

        public Guid Add(MusicParamModel param) {
            Guid id = Guid.NewGuid();

            using (var connection = unitOfWork.CreateConnection()) {
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("Id", id);
                parameters.Add("Name", param.Name);
                parameters.Add("Path", param.Path);
                parameters.Add("Source", param.Source);
                string sql = "insert into Music (Id, Name, Path, Source, Sort) values (@Id, @Name, @Path, @Source, (select count(1)+1 from Music));";
                connection.Execute(sql, parameters);
            }

            return id;
        }

        public void Delete(WindowInfoParamModel param) {
            using (var connection = unitOfWork.CreateConnection()) {
                string sql = @"update Music set Sort=Sort-1 where Sort>(select Sort from Music where ID = @ID);
                    delete from Music where ID = @ID;";
                connection.Execute(sql, new { ID = param.Id });
            }
        }

    }
}
