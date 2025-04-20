namespace Desktop.Models.Contexts {
    public class Weather {
        public Records records { get; set; }

        public class Records {
            public List<Locations> Locations { get; set; }
        }

        public class Locations {
            public string DatasetDescription { get; set; }
            public string LocationsName { get; set; }
            public string Dataid { get; set; }
            public List<Location> Location { get; set; }
        }

        public class Location {
            public string LocationName { get; set; }
            public string Geocode { get; set; }
            public string Latitude { get; set; }
            public string Longitude { get; set; }
            public List<Weatherelement> WeatherElement { get; set; }
        }

        public class Weatherelement {
            public string ElementName { get; set; }
            public List<Time> Time { get; set; }
        }

        public class Time {
            public DateTime StartTime { get; set; }
            public DateTime EndTime { get; set; }
            public List<Elementvalue> ElementValue { get; set; }
        }

        public class Elementvalue {
            public string Temperature { get; set; }//平均溫度
            public string Weather { get; set; }//天氣現象
            public string WeatherCode { get; set; }//天氣現象
        }
    }
}
