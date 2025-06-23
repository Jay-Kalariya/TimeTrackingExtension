using Dotnet1.Models;
using Microsoft.EntityFrameworkCore;
using Dotnet1.DTOs;
using DotnetTask = Dotnet1.Models.Task;

namespace Dotnet1.Services
{
    public class AdminTaskService
    {
        private readonly TimeTrackingContext _context;

        public AdminTaskService(TimeTrackingContext context)
        {
            _context = context;
        }

        public async Task<List<DotnetTask>> GetAllAsync()
        {
            return await _context.Tasks.ToListAsync();
        }

        public async Task<DotnetTask?> GetByIdAsync(int id)
        {
            return await _context.Tasks.FindAsync(id);
        }

        public async Task<List<DotnetTask>> GetTasksForUserAsync(int userId)
        {
            return await _context.TaskAssignments
                .Where(ta => ta.UserId == userId)
                .Include(ta => ta.Task)
                .Select(ta => ta.Task)
                .ToListAsync();
        }

        public async Task<DotnetTask> CreateAsync(DotnetTask task)
        {
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            return task;
        }

        public async Task<bool> UpdateAsync(int id, DotnetTask updatedTask)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null || task.IsProtected) return false;

            task.Name = updatedTask.Name;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null || task.IsProtected) return false;

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<TaskAssignment?> AssignTaskAsync(TaskAssignmentDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            var task = await _context.Tasks.FindAsync(dto.TaskId);

            if (user == null || task == null) return null;

            var existing = await _context.TaskAssignments
                .FirstOrDefaultAsync(ta => ta.TaskId == dto.TaskId && ta.UserId == dto.UserId);
            
            if (existing != null) return existing;

            var assignment = new TaskAssignment
            {
                UserId = dto.UserId,
                TaskId = dto.TaskId
            };

            _context.TaskAssignments.Add(assignment);
            await _context.SaveChangesAsync();
            return assignment;
        }

        public async Task<List<TaskAssignmentDto>> GetAllAssignmentsAsync()
        {
            return await _context.TaskAssignments
                .Include(ta => ta.Task)
                .Include(ta => ta.User)
                .Select(ta => new TaskAssignmentDto
                {
                    TaskId = ta.TaskId,
                    UserId = ta.UserId,
                    TaskName = ta.Task.Name,
                    UserName = ta.User.Username
                }).ToListAsync();
        }

        public async Task<bool> UnassignTaskAsync(int taskId, int userId)
        {
            var assignment = await _context.TaskAssignments
                .FirstOrDefaultAsync(ta => ta.TaskId == taskId && ta.UserId == userId);

            if (assignment == null) 
            {
                Console.WriteLine($"No assignment found for TaskId: {taskId}, UserId: {userId}");
                return false;
            }

            _context.TaskAssignments.Remove(assignment);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}