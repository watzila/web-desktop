using Backstage.Utility;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Data;
using System.Data.SqlClient;

//�Ы�Web���ε{���ͦ���
var builder = WebApplication.CreateBuilder(args);

//�K�[�A�Ȩ�DI�e����
builder.Services.AddControllersWithViews();

builder.Services.AddTransient<IDbConnection, SqlConnection>(serviceProvider => {
    SqlConnection conn = new SqlConnection {
        ConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    };
    return conn;
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(option => {
    option.Cookie.Name = builder.Configuration["CookieName"];
    option.LoginPath = "/Login";
    option.LogoutPath = "/Login/Out";
});
builder.Services.AddSingleton<ProjectShare>();
builder.Services.AddHttpClient();

//�c�����ε{��
var app = builder.Build();

// Configure the HTTP request pipeline.
//if(!app.Environment.IsDevelopment()) {
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    //app.UseHsts();//�ҥ� HSTS
//}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.UseCookiePolicy();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();