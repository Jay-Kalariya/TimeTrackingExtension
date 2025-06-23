using Dotnet1.Models;
using Dotnet1.Services;
using Dotnet1.DTOs; // ✅ Use the external DTO
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Dotnet1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsersAsync()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUserAsync(int id, [FromBody] User updatedUser)
        {
            if (updatedUser == null)
                return BadRequest(new { message = "Invalid data." });

            var result = await _userService.UpdateUserAsync(id, updatedUser);
            if (result == null)
                return NotFound(new { message = "User not found." });

            return Ok(result);
        }

        // ✅ FIX: Use external DTO from namespace
        [HttpPut("{id}/password")]
        public async Task<IActionResult> UpdateUserPassword(int id, [FromBody] PasswordUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NewPassword))
                return BadRequest(new { message = "New password is required." });

            var success = await _userService.UpdateUserPasswordAsync(id, dto.NewPassword);
            if (!success)
                return NotFound(new { message = "User not found." });

            return Ok(new { message = "Password updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserAsync(int id)
        {
            var success = await _userService.DeleteUserAsync(id);
            if (!success)
                return NotFound(new { message = "User not found." });

            return Ok(new { message = "User deleted successfully." });
        }

        [HttpGet("me")]
        [AllowAnonymous]
        public IActionResult GetCurrentUser()
        {
            var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            return Ok(new { id, username, email, role });
        }
    }
}
