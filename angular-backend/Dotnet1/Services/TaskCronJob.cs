using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks; // <-- This is for async Task
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Dotnet1.Models;
using ModelTask = Dotnet1.Models.Task; // <-- Avoid Task conflict

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
            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromMinutes(1));
            return System.Threading.Tasks.Task.CompletedTask;
        }

        private void DoWork(object state)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TimeTrackingContext>();

            var now = DateTime.Now;

            var activeSessions = db.TaskSessions
                .Include(ts => ts.Task)
                .Include(ts => ts.User)
                .Where(ts => ts.EndTime == null)
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

            db.SaveChanges();
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
