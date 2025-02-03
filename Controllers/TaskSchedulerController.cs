using Backstage.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Win32.TaskScheduler;
using Task = Microsoft.Win32.TaskScheduler.Task;

namespace Backstage.Controllers {
    public class TaskSchedulerController:Controller {

        [HttpPost]
        public IActionResult Index([FromBody] WindowInfoParamModel paramModel) {
            TempData["title"] = paramModel.Title;
            TempData["iconPath"] = paramModel.IconPath;
            TempData["open"] = paramModel.Open;
            TempData["js"] = "TaskScheduler";
            List<Task> tasks = new List<Task>();
            using (TaskService ts = new TaskService()) {
                tasks.AddRange(ts.AllTasks.Where(a => a.Folder.Name == "\\").ToList());
            }
            return View(tasks);
        }

        [HttpGet]
        public void Run(string path) {
            using(TaskService ts = new TaskService()) {
                Task task = ts.GetTask(path);
                task?.Run();
            }
        }

        [HttpGet]
        public void Stop(string path) {
            using (TaskService ts = new TaskService()) {
                Task task = ts.GetTask(path);
                task?.Stop();
            }
        }


    }
}
