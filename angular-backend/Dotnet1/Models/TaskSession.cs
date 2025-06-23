using Dotnet1.Models;
using System.ComponentModel.DataAnnotations.Schema;

namespace Dotnet1.Models
{
    public class TaskSession
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int TaskId { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        [NotMapped]
        public double Duration => EndTime.HasValue ? (EndTime.Value - StartTime).TotalSeconds : 0;

        public User User { get; set; } = null!;
        public Dotnet1.Models.Task Task { get; set; } = null!;
    }


}
