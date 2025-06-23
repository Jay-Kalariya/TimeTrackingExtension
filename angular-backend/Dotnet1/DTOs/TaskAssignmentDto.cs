namespace Dotnet1.Models
{
    public class TaskAssignmentDto
    {
        public int TaskId { get; set; }
        public int UserId { get; set; }

        // ✅ Add these two properties
        public string? TaskName { get; set; }
        public string? UserName { get; set; }
    }
}
