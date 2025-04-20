using System;
using System.Collections.Generic;

namespace Desktop.Models.Contexts;

public partial class Card
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public int Attack { get; set; }

    public int Health { get; set; }

    public int Cost { get; set; }
}
