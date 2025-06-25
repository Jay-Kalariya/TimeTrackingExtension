using Dotnet1.Models;
using Dotnet1.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using DotnetTask = Dotnet1.Models.Task;

namespace Dotnet1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminTaskController : ControllerBase
    {
        private readonly AdminTaskService _service;
        private readonly TimeTrackingContext _context;
        private readonly TaskService _taskService;

        public AdminTaskController(AdminTaskService service, TaskService taskService, TimeTrackingContext context)
        {
            _service = service;
              _taskService = taskService;
            _context = context;
            
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DotnetTask>>> GetAllTasks()
        {
            return Ok(await _service.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DotnetTask>> GetTask(int id)
        {
            var task = await _service.GetByIdAsync(id);
            return task == null ? NotFound() : Ok(task);
        }

        [HttpGet("user/current")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<DotnetTask>>> GetTasksForCurrentUser()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var tasks = await _service.GetTasksForUserAsync(userId);
                return Ok(tasks);
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<DotnetTask>>> GetTasksForUser(int userId)
        {
            return Ok(await _service.GetTasksForUserAsync(userId));
        }

        [HttpPost]
        public async Task<ActionResult<DotnetTask>> CreateTask(DotnetTask task)
        {
            var created = await _service.CreateAsync(task);
            return CreatedAtAction(nameof(GetTask), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, DotnetTask task)
        {
            var result = await _service.UpdateAsync(id, task);
            return result ? NoContent() : BadRequest("Cannot update protected or missing task.");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var result = await _service.DeleteAsync(id);
            return result ? NoContent() : BadRequest("Cannot delete protected or missing task.");
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignTask([FromBody] TaskAssignmentDto dto)
        {
            var assignment = await _service.AssignTaskAsync(dto);
            if (assignment == null)
                return BadRequest("Invalid user or task.");

            return Ok(new
            {
                TaskId = assignment.TaskId,
                UserId = assignment.UserId,
                Message = "Task assigned successfully"
            });
        }

        [HttpGet("assignments")]
        public async Task<ActionResult<IEnumerable<TaskAssignmentDto>>> GetAllAssignments()
        {
            var assignments = await _service.GetAllAssignmentsAsync();
            return Ok(assignments);
        }

        [HttpDelete("unassign/{taskId}/{userId}")]
        public async Task<IActionResult> UnassignTask(int taskId, int userId)
        {
            var success = await _service.UnassignTaskAsync(taskId, userId);
            return success ? NoContent() : NotFound("Assignment not found.");
        }
        
        
        [HttpGet("status/all-users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUserStatuses()
        {
            var today = DateTime.UtcNow.Date;
            var users = await _context.Users.ToListAsync();

            var statuses = new List<object>();

            foreach (var user in users)
            {
                var hasLogged = await _taskService.HasLoggedTaskTodayAsync(user.Id);
                statuses.Add(new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    LoggedToday = hasLogged
                });
            }

            return Ok(statuses);
        }
    }
}