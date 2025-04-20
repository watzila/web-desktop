using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;

namespace Desktop.Controllers {
    public class BaseController:ControllerBase {
        /// <summary>
        /// 登入者ID
        /// </summary>
        protected Guid customId {
            get {
                var val = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return Guid.Parse(val);
            }
        }
    }
}
