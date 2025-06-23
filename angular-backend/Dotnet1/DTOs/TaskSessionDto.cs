namespace Dotnet1.DTOs
{
    public class TaskSessionDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string TaskName { get; set; } = "";
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public double Duration { get; set; }
    }
}
