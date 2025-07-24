using System;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using ModelTask = Dotnet1.Models.Task;
using Dotnet1.Models;
using Dotnet1;


// ... [Same using directives]

namespace Dotnet1.Services
{

    public class TaskCronJob : IHostedService, IDisposable
    {
        private Timer _timer;
        private readonly ILogger<TaskCronJob> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public TaskCronJob(ILogger<TaskCronJob> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public System.Threading.Tasks.Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("TaskCronJob started.");
            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromMinutes(1)); // Runs every 1 minute
            return System.Threading.Tasks.Task.CompletedTask;
        }

        private void DoWork(object state)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TimeTrackingContext>();
            var now = DateTime.Now;

            // --- 1. Auto-close sessions that individually exceed 8 hours ---
            var activeSessions = db.TaskSessions
      .Include(ts => ts.Task)
      .Include(ts => ts.User)
      .Where(ts => ts.EndTime == null && ts.Task.IsProtected == false)
      .ToList();


            foreach (var session in activeSessions)
            {
                var duration = (now - session.StartTime).TotalSeconds;

                if (duration >= 28800) // 8 hours
                {
                    session.EndTime = now;
                    _logger.LogInformation($"Ended session for Task ID {session.TaskId} - Duration: {TimeSpan.FromSeconds(duration)}");
                }
            }

            // ✅ 1.5 Enforce total 8-hour limit per user per day
            var today = now.Date;
            var tomorrow = today.AddDays(1);

            var todaysSessions = db.TaskSessions
      .Include(ts => ts.User)
      .Include(ts => ts.Task)
      .Where(ts => ts.StartTime >= today && ts.StartTime < tomorrow && ts.Task.IsProtected == false)
      .ToList();

            var groupedByUser = todaysSessions.GroupBy(s => s.UserId);

            foreach (var userGroup in groupedByUser)
            {
                var total = TimeSpan.Zero;

                foreach (var session in userGroup.OrderBy(s => s.StartTime))
                {
                    var sessionDuration = (session.EndTime ?? now) - session.StartTime;

                    if (total + sessionDuration > TimeSpan.FromHours(8))
                    {
                        // Stop at 8-hour mark if session still active
                        if (session.EndTime == null)
                        {
                            var remaining = TimeSpan.FromHours(8) - total;
                            session.EndTime = session.StartTime + remaining;
                            _logger.LogInformation($"[Auto-Stop] User {session.User.Username} exceeded 8 hours. Stopped TaskSession {session.Id} at {session.EndTime.Value}.");
                        }
                        break;
                    }

                    total += sessionDuration;
                }
            }

            db.SaveChanges();

            // --- 2. Send Daily Report ---
            var startOfDay = now.Date;
            var endOfDay = startOfDay.AddDays(1);

            var dailySessions = db.TaskSessions
      .Include(ts => ts.User)
      .Include(ts => ts.Task)
      .Where(ts => ts.StartTime >= startOfDay && ts.StartTime < endOfDay && ts.Task.IsProtected == false)
      .ToList();


            var groupedDailyByUser = dailySessions.GroupBy(s => s.User);

            foreach (var group in groupedDailyByUser)
            {
                var user = group.Key;
                var totalSeconds = group.Sum(s => ((s.EndTime ?? now) - s.StartTime).TotalSeconds);
                var message = $"Hello {user.Username},\n\nYour total tracked time today: {TimeSpan.FromSeconds(totalSeconds):hh\\:mm\\:ss}.";

                _logger.LogInformation($"[Daily Report] To: {user.Email}\n{message}");
                // TODO: Send email here
            }

            // --- 3. Monthly Report ---
            if (now.Day == 1)
            {
                var startOfMonth = new DateTime(now.Year, now.Month - 1, 1);
                var endOfMonth = new DateTime(now.Year, now.Month, 1);

                var monthlySessions = db.TaskSessions
      .Include(ts => ts.User)
      .Include(ts => ts.Task)
      .Where(ts => ts.StartTime >= startOfMonth && ts.StartTime < endOfMonth && ts.Task.IsProtected == false)
      .ToList();

                var monthlyGrouped = monthlySessions.GroupBy(s => s.User);

                foreach (var group in monthlyGrouped)
                {
                    var user = group.Key;
                    var totalSeconds = group.Sum(s => ((s.EndTime ?? now) - s.StartTime).TotalSeconds);

                    var sb = new StringBuilder();
                    sb.AppendLine($"Hello {user.Username},");
                    sb.AppendLine($"Here is your tracked time report for {startOfMonth:MMMM yyyy}:");
                    sb.AppendLine($"Total time: {TimeSpan.FromSeconds(totalSeconds):hh\\:mm\\:ss}");

                    foreach (var taskGroup in group.GroupBy(s => s.TaskId))
                    {
                        var taskId = taskGroup.Key;
                        var taskTime = taskGroup.Sum(s => ((s.EndTime ?? now) - s.StartTime).TotalSeconds);
                        sb.AppendLine($" - Task #{taskId}: {TimeSpan.FromSeconds(taskTime):hh\\:mm\\:ss}");
                    }

                    _logger.LogInformation($"[Monthly Report] To: {user.Email}\n{sb}");
                    // TODO: Send email here
                }
            }
        }

        public System.Threading.Tasks.Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("TaskCronJob stopped.");
            _timer?.Change(Timeout.Infinite, 0);
            return System.Threading.Tasks.Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }
    }
}

