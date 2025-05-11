using Desktop.Models.Contexts;
using Desktop.Domain.Models;
using AutoMapper;

namespace Desktop.BLL.Profiles {
    public class MappingProfile:Profile {
		public MappingProfile ( ) {
            CreateMap<ACLObject, ACLObjectModel.Items>();
            CreateMap<Music, MusicModel.Items>();
            CreateMap<Users, UsersModel> ( );
            CreateMap<Files, TextModel> ( );
        }
	}
}
