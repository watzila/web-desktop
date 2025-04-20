using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace Desktop.Domain {
    public class ResultObject<T> {
        /// <summary>
        /// State Code
        /// </summary>
        [JsonPropertyOrder(1)]
        public int ReturnCode { get; set; }

        /// <summary>
        /// Message
        /// </summary>
        [JsonPropertyOrder(2)]
        public string ReturnMsg { get; set; }

        [JsonPropertyOrder(4)]
        public string Js { get; set; }
    }

    public class ResultSuccess<T> : ResultObject<T> {

        /// <summary>
        /// return Object
        /// </summary>
        [JsonPropertyOrder(3)]
        public T ReturnData { get; set; }

    }

    public class ResultFail<T> : ResultObject<T> {

        /// <summary>
        /// Gets or sets the stack trace.
        /// </summary>
        /// <value>The stack trace.</value>
        [JsonPropertyOrder(3)]
        public string StackTrace { get; set; }

    }

    public class ResultModel<T> : IActionResult {
        private ResultObject<T> _result;

        public ResultModel() { }

        public ResultModel(T value, string js = "") {
            _result = new ResultSuccess<T>() {
                ReturnCode = 200,
                ReturnMsg = "success",
                ReturnData = value,
                Js = js
            };
        }

        public ResultModel(Exception exception) {
            if (exception is AppException) // project exceptoin
            {
                AppException ex = exception as AppException;
                _result = new ResultFail<T>() {
                    ReturnCode = ex.StatusCode,
                    ReturnMsg = exception.Message,
                    StackTrace = exception.StackTrace
                };

            } else  // other exception
              {
                string message = exception.Message;

                if (exception.InnerException != null) {
                    message = $"Exceptoin:{exception.Message} InnerException:{exception.InnerException.Message}";
                }


                _result = new ResultFail<T>() {
                    ReturnCode = 400,
                    ReturnMsg = message,
                    StackTrace = exception.StackTrace
                };
            }
        }

        public async Task ExecuteResultAsync(ActionContext context) {
            ObjectResult objectResult = null;

            if (this._result is ResultSuccess<T>) {
                objectResult = new ObjectResult(this._result) {
                    StatusCode = StatusCodes.Status200OK
                };
            }

            if (this._result is ResultFail<T>) {
                objectResult = new ObjectResult((object)this._result) {
                    StatusCode = ((ResultFail<T>)this._result).ReturnCode
                };
            }

            if (objectResult != null) {
                await objectResult.ExecuteResultAsync(context);
            }
        }

    }
}
