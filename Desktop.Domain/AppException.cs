using System.Runtime.Serialization;

namespace Desktop.Domain {
    public class AppException : Exception {
        public virtual int StatusCode { get; }

        public AppException() : base(string.Empty) { }
        public AppException(string message) : base(message) { }
        public AppException(string message, Exception inner) : base(message, inner) { }
        public AppException(string message, int statusCode) : base(message) {
            StatusCode = statusCode;
        }
    }
}
