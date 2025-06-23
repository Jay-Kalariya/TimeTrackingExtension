using Dotnet1.DTOs;
using Dotnet1.Models;
using Dotnet1.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Dotnet1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class ProjectController : ControllerBase
    {
        private readonly ProjectService _projectService;

        public ProjectController(ProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] ProjectDto dto)
        {
            var adminIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(adminIdClaim))
            {
                return Unauthorized(new { message = "Admin ID claim not found." });
            }

            int adminId = int.Parse(adminIdClaim);

            var project = new Project
            {
                Name = dto.Name,
                CreatedByAdminId = adminId
            };

            var created = await _projectService.CreateProjectAsync(project);
            return Ok(created);
        }


        [HttpPost("assign-task")]
        public async Task<IActionResult> AssignTask([FromQuery] int taskId, [FromQuery] int projectId)
        {
            var success = await _projectService.AssignTaskToProjectAsync(taskId, projectId);
            return success ? Ok(new { message = "Task assigned to project." }) :
                             NotFound(new { message = "Task or Project not found." });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllProjects()
        {
            var projects = await _projectService.GetAllProjectsAsync();
            return Ok(projects);
        }


        // In ProjectController.cs

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] ProjectDto dto)
        {
            var updated = await _projectService.UpdateProjectAsync(id, dto.Name);
            return updated ? Ok(new { message = "Project updated" }) : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var deleted = await _projectService.DeleteProjectAsync(id);
            return deleted ? Ok(new { message = "Project deleted" }) : NotFound();
        }

    }
}
