using System.ComponentModel.DataAnnotations;

namespace Dotnet1.Models
{
   public enum Role{
    Admin,
    User
   }
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string Role { get; set; } = "User";

        public ICollection<TaskSession> TaskSessions { get; set; } = new List<TaskSession>();
            public ICollection<TaskAssignment> TaskAssignments { get; set; } = new List<TaskAssignment>();
}


}