using Dotnet1.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Dotnet1.Services
{
    public class UserService
    {
        private readonly TimeTrackingContext _dbContext;

        public UserService(TimeTrackingContext dbContext)
        {
            _dbContext = dbContext;
        }

        // Get all users (non-admin)
        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _dbContext.Users
                .Where(u => u.Role != "Admin")
                .ToListAsync();
        }

        // Get user by ID
        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _dbContext.Users.FindAsync(id);
        }

        // Update user info (excluding password)
        public async Task<User?> UpdateUserAsync(int id, User updatedUser)
        {
            var user = await _dbContext.Users.FindAsync(id);
            if (user == null) return null;

            user.Username = updatedUser.Username;
            user.Email = updatedUser.Email;
            user.Role = updatedUser.Role;

            _dbContext.Users.Update(user);
            await _dbContext.SaveChangesAsync();
            return user;
        }

        // Update user password (new method)
        public async Task<bool> UpdateUserPasswordAsync(int id, string newPassword)
        {
            var user = await _dbContext.Users.FindAsync(id);
            if (user == null) return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

            _dbContext.Users.Update(user);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // Delete user
        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _dbContext.Users.FindAsync(id);
            if (user == null) return false;

            _dbContext.Users.Remove(user);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // Check if user exists by email (registration/login)
        public async Task<bool> UserExistsAsync(string email)
        {
            return await _dbContext.Users.AnyAsync(u => u.Email == email);
        }

        // Get user's role by ID
        public async Task<string?> GetUserRoleAsync(int id)
        {
            var user = await _dbContext.Users.FindAsync(id);
            return user?.Role;
        }
    }
}
