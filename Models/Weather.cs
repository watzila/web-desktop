namespace Backstage.Models {
    public class Weather {
        public Records records { get; set; }

        public class Records {
            public List<Locations> locations { get; set; }
        }

        public class Locations {
            public string datasetDescription { get; set; }
            public string locationsName { get; set; }
            public string dataid { get; set; }
            public List<Location> location { get; set; }
        }

        public class Location {
            public string locationName { get; set; }
            public string geocode { get; set; }
            public string lat { get; set; }
            public string lon { get; set; }
            public List<Weatherelement> weatherElement { get; set; }
        }

        public class Weatherelement {
            public string elementName { get; set; }
            public string description { get; set; }
            public List<Time> time { get; set; }
        }

        public class Time {
            public DateTime startTime { get; set; }
            public DateTime endTime { get; set; }
            public List<Elementvalue> elementValue { get; set; }
        }

        public class Elementvalue {
            public string value { get; set; }
            public string measures { get; set; }
        }

        public class DeskTopTool {
            public string Temperature { get; set; }
            public string WeatherIMG { get; set; }
        }
    }
}
