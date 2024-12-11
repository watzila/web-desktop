using Backstage.Utility;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Backstage.Controllers {
    public class BaseController:Controller {
        ProjectShare share;
        protected Models.Users getUsers { get; private set; }
        //protected Models.WebLog log { get; set; } = new Models.WebLog();
        protected NeedRedirect needRedirect { get; private set; }
        protected struct NeedRedirect {
            public string Url;
            public string Message;
        }

        public BaseController(ProjectShare share) {
            this.share = share;
        }

        public override void OnActionExecuting(ActionExecutingContext context) {
            base.OnActionExecuting(context);
            // Check to see if we need to skip authentication
            if(context.ActionDescriptor.EndpointMetadata.OfType<AllowAnonymousAttribute>().Any())
                return;

            getUsers = share.IsLogin();
            if(getUsers.ID.Equals(Guid.Empty)) {
                TempData["err"] = getUsers.Txt;
                //log.ErrorMessage = getUsers.Txt;
                //if(context.HttpContext.Request.IsAjaxRequest()) {
                //    needRedirect = new NeedRedirect() {
                //        Url = "/Login",
                //        Message = getUsers.Txt
                //    };
                //} else {
                    context.Result = new RedirectToRouteResult(new RouteValueDictionary { { "controller", "Login" }, { "action", "Index" } });
                //}
                return;
            }
        }

        //public override async Task OnResultExecutionAsync(ResultExecutingContext context, System.Threading.CancellationToken cancellationToken) {
        //    base.OnResultExecutionAsync(context);
        //    log.UID = getUsers?.ID ?? Guid.Empty;
        //    log.Channel = $"{context.RouteData.Values["controller"]}/{context.RouteData.Values["action"]}";

        //    using(var bodyStream = new StreamReader(Request.Body)) {
        //        bodyStream.BaseStream.Seek(0, SeekOrigin.Begin);
        //        log.RequestData = await bodyStream.ReadToEndAsync();
        //    }
        //    // Utility.CreateLog(log);
        //}
    }
}
