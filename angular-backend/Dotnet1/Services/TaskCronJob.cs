using System;
using System.Threading;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Dotnet1.Models;
using System.Linq;

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
            _logger.LogInformation("✅ TaskCronJob started...");
            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromMinutes(5));
            return System.Threading.Tasks.Task.CompletedTask;
        }

        private async void DoWork(object state)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TimeTrackingContext>();

            var now = DateTime.UtcNow;
            var cutoff = now.AddMinutes(-6); // ✅ Safe for SQL translation

            try
            {
                var inactiveSessions = await db.TaskSessions
                    .Where(t => t.EndTime == null && t.StartTime < cutoff)
                    .ToListAsync();

                foreach (var session in inactiveSessions)
                {
                    session.EndTime = now;
                    _logger.LogInformation($"🛑 Auto-ended session ID: {session.Id}");
                }

                if (inactiveSessions.Any())
                {
                    await db.SaveChangesAsync();
                    _logger.LogInformation($"✅ Saved {inactiveSessions.Count} ended sessions.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error while checking inactive sessions in TaskCronJob.");
            }
        }

        public System.Threading.Tasks.Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("🛑 TaskCronJob stopped.");
            _timer?.Change(Timeout.Infinite, 0);
            return System.Threading.Tasks.Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }
    }
}
