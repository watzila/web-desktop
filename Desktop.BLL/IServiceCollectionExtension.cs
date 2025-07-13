using Desktop.BLL.Interface;
using Desktop.BLL.Service;
using Desktop.DAL.Interface;
using Desktop.DAL.UnitOfWork;
using Microsoft.Extensions.DependencyInjection;

namespace Desktop.BLL {
    public static class IServiceCollectionExtension {
        public static IServiceCollection AddBLLConnector(this IServiceCollection services) {
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<IUsersService, UsersService>();
            services.AddScoped<IHomeService, HomeService>();
            services.AddScoped<IMusicService, MusicService>();
            services.AddScoped<IFolderService, FolderService>();
            services.AddScoped<ISettingService, SettingService>();
            services.AddScoped<IFileService, FileService>();
            services.AddScoped<ITwseService, TwseService>();

            return services;
        }
    }
}
