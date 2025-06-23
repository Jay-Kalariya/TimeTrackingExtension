
using Dotnet1.Models;

namespace Dotnet1.Models
{
public class Project
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int CreatedByAdminId { get; set; }

    public ICollection<Task> Tasks { get; set; } = new List<Task>();
}


}
