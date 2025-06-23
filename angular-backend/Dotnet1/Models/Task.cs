using System.Text.Json.Serialization;

namespace Dotnet1.Models
{
    public class Task
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        [JsonIgnore]
        public int? ProjectId { get; set; }
        public Project? Project { get; set; }

        public bool IsProtected { get; set; } = false;

        public ICollection<TaskAssignment> TaskAssignments { get; set; } = new List<TaskAssignment>();
    }
}
