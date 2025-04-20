using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Desktop.BLL.Interface;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Desktop.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class AsyncAwaitController:BaseController {
        // GET: api/<AsyncAwaitController>
        [HttpGet]
        [AllowAnonymous]
        public async Task<int> Get() {
            var a = aa();
            var b = bb();
            int result = await a + await b;

            return result;
        }

        private async Task<int> aa() {
            await Task.Delay(1000);

            return 1;
        }

        private async Task<int> bb() {
            await Task.Delay(2000);

            return 2;
        }
    }
}
