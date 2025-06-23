using Dotnet1.Models;
using Dotnet1.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dotnet1.DTOs;
using System.Security.Claims;

namespace Dotnet1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly TaskService _taskService;
        private readonly AdminTaskService _adminTaskService;

        public TaskController(TaskService taskService, AdminTaskService adminTaskService)
        {
            _taskService = taskService;
            _adminTaskService = adminTaskService;
        }

        [HttpPost("start")]
        public async Task<IActionResult> StartTaskAsync([FromBody] TaskStartDto startTaskDto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            try
            {
                var session = await _taskService.StartTaskAsync(userId, startTaskDto.TaskTypeId);
                return Ok(session);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("end")]
        public async Task<IActionResult> EndCurrentTaskAsync()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var success = await _taskService.EndCurrentTaskAsync(userId);
            return success ? Ok(new { message = "Task ended successfully." })
                         : NotFound("No active task session found.");
        }

        [HttpPost("break")]
        public async Task<IActionResult> GoOnBreakAsync([FromBody] string breakType)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            try
            {
                var session = await _taskService.GoOnBreakAsync(userId, breakType);
                return Ok(session);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetTaskHistoryAsync()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var history = await _taskService.GetTaskHistoryAsync(userId);
            return Ok(history);
        }

        [HttpGet("admin/history/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserTaskHistory(int userId)
        {
            try
            {
                // Verify user exists
                if (!await _taskService.UserExistsAsync(userId))
                {
                    return NotFound(new { message = $"User with ID {userId} not found" });
                }

                var history = await _taskService.GetTaskHistoryAsync(userId);

                if (!history.Any())
                {
                    return Ok(new
                    {
                        message = "No task history found for this user",
                        data = history
                    });
                }

                return Ok(history);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetUserTaskHistory: {ex}");
                return StatusCode(500, new
                {
                    message = "An error occurred while fetching task history",
                    error = ex.Message
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTasks()
        {
            try
            {
                var tasks = await _taskService.GetAllTasksAsync();
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get tasks", error = ex.Message });
            }
        }

        [HttpGet("dashboard-tasks")]
        public async Task<IActionResult> GetTasksForDashboard()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var tasks = await _taskService.GetTasksForUserDashboardAsync(userId);
            return Ok(tasks);
        }
    }
}