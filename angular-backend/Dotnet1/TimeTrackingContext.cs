using Microsoft.EntityFrameworkCore;
using Dotnet1.Models;
using TaskModel = Dotnet1.Models.Task;

namespace Dotnet1
{
    public class TimeTrackingContext : DbContext
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<TaskModel> Tasks => Set<TaskModel>();
        public DbSet<TaskSession> TaskSessions => Set<TaskSession>();
        public DbSet<UserToken> UserTokens => Set<UserToken>();
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<TaskAssignment> TaskAssignments => Set<TaskAssignment>();

        public TimeTrackingContext(DbContextOptions<TimeTrackingContext> options)
            : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ✅ Seed protected tasks
            modelBuilder.Entity<TaskModel>().HasData(
                new TaskModel { Id = 1, Name = "Task A", IsProtected = false },
                new TaskModel { Id = 2, Name = "Task B", IsProtected = false },
                new TaskModel { Id = 3, Name = "Break", IsProtected = true },
                new TaskModel { Id = 4, Name = "Lunch", IsProtected = true },
                new TaskModel { Id = 5, Name = "Day Off", IsProtected = true }
            );

            // ✅ Task → Project
            modelBuilder.Entity<TaskModel>()
                .HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Task_Project");

            // ✅ TaskAssignment → Task
            modelBuilder.Entity<TaskAssignment>()
                .HasOne(ta => ta.Task)
                .WithMany(t => t.TaskAssignments)
                .HasForeignKey(ta => ta.TaskId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_TaskAssignment_Task");

            // ✅ TaskAssignment → User
            modelBuilder.Entity<TaskAssignment>()
                .HasOne(ta => ta.User)
                .WithMany(u => u.TaskAssignments)
                .HasForeignKey(ta => ta.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_TaskAssignment_User");

            // ✅ TaskSession → Task
            modelBuilder.Entity<TaskSession>()
                .HasOne(ts => ts.Task)
                .WithMany()
                .HasForeignKey(ts => ts.TaskId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_TaskSession_Task");

            // ✅ TaskSession → User
            modelBuilder.Entity<TaskSession>()
                .HasOne(ts => ts.User)
                .WithMany(u => u.TaskSessions)
                .HasForeignKey(ts => ts.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_TaskSession_User");
        }
    }
}
