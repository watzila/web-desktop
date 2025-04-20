using Desktop.BLL.Interface;
using Desktop.Domain.Models;
using Desktop.Models.Contexts;
using Desktop.DAL.Interface;
using Dapper;
using Newtonsoft.Json;
using Desktop.Domain;

namespace Desktop.BLL.Service {
    public class UsersService(IUnitOfWork unitOfWork, ProjectShare share) : IUsersService {
        //public Users Signup(UsersParamModel param) {
        //    Users data;
        //    using (var connection = unitOfWork.CreateConnection()) {
        //        DynamicParameters parameters = new DynamicParameters();
        //        parameters.Add("Account", param.Account);
        //        parameters.Add("Password", param.Password);
        //        string sql = "SELECT * FROM Users WHERE Account = @Account AND Password = @Password";
        //        data = connection.Query<Users>(sql, parameters).SingleOrDefault();
        //    }

        //    if(data != null) {
        //        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, data.Id.ToString()) };
        //        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JWT:Key"]));
        //        var jwt = new JwtSecurityToken(
        //            issuer: configuration["JWT:Issuer"],
        //            audience: configuration["JWT:Audience"],
        //            claims: claims,
        //            expires: DateTime.Now.AddMinutes(3),
        //            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        //            );
        //        var token = new JwtSecurityTokenHandler().WriteToken(jwt);

        //        data.RefreshToken = token;

        //        using (var connection = unitOfWork.CreateConnection()) {
        //            DynamicParameters parameters = new DynamicParameters();
        //            parameters.Add("Id", data.Id);
        //            parameters.Add("RefreshToken", token);
        //            string sql = "UPDATE Users SET RefreshToken = @RefreshToken WHERE Id = @Id";
        //            connection.Execute(sql, parameters);
        //        }
        //    }

        //    return data;
        //}
        public async Task<UsersModel> List(WindowInfoParamModel param) {
            UsersModel result = new UsersModel();

            using (var connection = unitOfWork.CreateConnection()) {
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("@ParentID", param.Id);
                string sql = "select * from ACLObject where ParentID=@ParentID and Status=1 order by Sort;";
                List<ACLObject> data = connection.Query<ACLObject>(sql, parameters).ToList();
                if (data.Count > 0) {
                    var response = await share.ApiConnect(data[0].ExecuteURL, JsonConvert.SerializeObject(new { data[0].ID }));
                    if (response.IsSuccessStatusCode) {
                        string apiResult = response.Content.ReadAsStringAsync().Result;
                        var firstModel = JsonConvert.DeserializeObject<UsersModel>(apiResult);
                    }
                }
            }

            return result;
        }

        public UsersModel Info(WindowInfoParamModel param) {
            UsersModel result = new UsersModel();

            using (var connection = unitOfWork.CreateConnection()) {
                DynamicParameters parameters = new DynamicParameters();
                parameters.Add("@ID", param.Id);
                string sql = "select * from ACLObject where ID=@ID and Status=1;";
                ACLObject data = connection.Query<ACLObject>(sql, parameters).SingleOrDefault();
                if (data != null) {
                    result.Data.ACLObjectID = data.ID;
                    result.Data.ACLObjectParentID = data.ParentID;
                    result.Data.Title = data.Name;
                    result.Data.Name = "名子";
                    result.Data.ProfileIMG = "https://placehold.jp/200x200.png";
                }
            }

            return result;
        }

    }
}
