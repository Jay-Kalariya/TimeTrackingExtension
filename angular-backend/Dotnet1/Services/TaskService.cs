using Dotnet1.Models;
using Microsoft.EntityFrameworkCore;
using Dotnet1.DTOs;

namespace Dotnet1.Services
{
    public class TaskService
    {
        private readonly TimeTrackingContext _context;

        public TaskService(TimeTrackingContext context)
        {
            _context = context;
        }

        public async Task<List<Models.Task>> GetAllTasksAsync()
        {
            return await _context.Tasks.ToListAsync();
        }

        public async Task<bool> UserExistsAsync(int userId)
        {
            return await _context.Users.AnyAsync(u => u.Id == userId);
        }

   public async Task<TaskSession> StartTaskAsync(int userId, int taskId)
{
    // ✅ Get current active session
    var activeSession = await _context.TaskSessions
        .FirstOrDefaultAsync(t => t.UserId == userId && t.EndTime == null);

    if (activeSession != null)
    {
        if (activeSession.TaskId == taskId)
        {
            // 🚫 Already working on this task – just return current session
            return activeSession;
        }

        // ✅ End current active session (different task)
        activeSession.EndTime = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    // 🔄 Check if last session of this task ended within 5 min (allow resume)
    var lastSession = await _context.TaskSessions
        .Where(t => t.UserId == userId && t.TaskId == taskId && t.EndTime != null)
        .OrderByDescending(t => t.EndTime)
        .FirstOrDefaultAsync();

    if (lastSession != null)
    {
        var timeSinceEnd = DateTime.UtcNow - lastSession.EndTime.Value;

        if (timeSinceEnd.TotalMinutes <= 5)
        {
            lastSession.EndTime = null; // ✅ Resume session
            await _context.SaveChangesAsync();
            return lastSession;
        }
    }

    // 🆕 Start new session
    var newSession = new TaskSession
    {
        UserId = userId,
        TaskId = taskId,
        StartTime = DateTime.UtcNow,
        EndTime = null
    };

    _context.TaskSessions.Add(newSession);
    await _context.SaveChangesAsync();
    return newSession;
}


        public async Task<bool> EndCurrentTaskAsync(int userId)
        {
            var active = await _context.TaskSessions
                .FirstOrDefaultAsync(t => t.UserId == userId && t.EndTime == null);

            if (active == null) return false;

            active.EndTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<TaskSession> GoOnBreakAsync(int userId, string breakType)
        {
            var active = await _context.TaskSessions
                .FirstOrDefaultAsync(t => t.UserId == userId && t.EndTime == null);

            if (active != null)
                throw new InvalidOperationException("Please end your current task before starting a break.");

            var breakTask = await _context.Tasks.FirstOrDefaultAsync(t => t.Name == breakType);
            if (breakTask == null)
                throw new ArgumentException("Invalid break type");

            var breakSession = new TaskSession
            {
                UserId = userId,
                TaskId = breakTask.Id,
                StartTime = DateTime.UtcNow,
                EndTime = null
            };

            _context.TaskSessions.Add(breakSession);
            await _context.SaveChangesAsync();
            return breakSession;
        }
        public async Task<List<TaskSessionDto>> GetTaskHistoryAsync(int userId)
        {
            try
            {
                var sessions = await _context.TaskSessions
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Task)
                    .OrderByDescending(t => t.StartTime)
                    .ToListAsync();

                // Now map to DTOs in memory
                var history = sessions.Select(t => new TaskSessionDto
                {
                    Id = t.Id,
                    TaskId = t.TaskId,
                    TaskName = t.Task != null ? t.Task.Name : "Unknown Task",
                    StartTime = t.StartTime,
                    EndTime = t.EndTime,
                    Duration = t.EndTime.HasValue ? (t.EndTime.Value - t.StartTime).TotalSeconds : 0
                }).ToList();

                return history;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetTaskHistoryAsync: {ex}");
                throw;
            }
        }

        public async Task<List<Models.Task>> GetTasksForUserDashboardAsync(int userId)
        {
            var assignedTasks = await _context.TaskAssignments
                .Where(a => a.UserId == userId)
                .Include(a => a.Task)
                .Select(a => a.Task)
                .ToListAsync();

            var defaultTasks = await _context.Tasks
                .Where(t => t.Name == "Lunch" || t.Name == "Break" || t.Name == "Day Off")
                .ToListAsync();

            return assignedTasks.Union(defaultTasks).ToList();
        }
    }
}