using System;
using System.Collections.Generic;

namespace Desktop.Models.Contexts;

public partial class Users
{
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string Account { get; set; }

    public string Password { get; set; }

    public string RefreshToken { get; set; }
    public string ProfileIMG { get; set; }
}
