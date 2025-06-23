using Dotnet1.Models;
using Microsoft.EntityFrameworkCore;

namespace Dotnet1.Services
{
    public class ProjectService
    {
        private readonly TimeTrackingContext _context;

        public ProjectService(TimeTrackingContext context)
        {
            _context = context;
        }

        public async Task<Project> CreateProjectAsync(Project project)
        {
            try
            {
                _context.Projects.Add(project);
                await _context.SaveChangesAsync();
                return project;
            }
            catch (Exception ex)
            {
                Console.WriteLine("🔥 Error while creating project: " + ex.Message);
                Console.WriteLine("🧠 StackTrace: " + ex.StackTrace);
                throw;
            }
        }


        public async Task<List<Project>> GetAllProjectsAsync()
        {
            return await _context.Projects
                .Include(p => p.Tasks)
                .ToListAsync();
        }

        public async Task<bool> AssignTaskToProjectAsync(int taskId, int projectId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            var project = await _context.Projects.FindAsync(projectId);

            if (task == null || project == null) return false;

            task.ProjectId = projectId;
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<bool> UpdateProjectAsync(int id, string name)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return false;

            project.Name = name;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteProjectAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return false;

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}
