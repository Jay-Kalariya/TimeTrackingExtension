using Dotnet1;
using Dotnet1.Services;
using Dotnet1.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Load configuration
var configuration = builder.Configuration;

// 1. Register MySQL DbContext
builder.Services.AddDbContext<TimeTrackingContext>(options =>
    options.UseMySql(configuration.GetConnectionString("DefaultConnection"),
        new MySqlServerVersion(new Version(8, 0, 36))));

// 2. Register Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<TaskService>();
builder.Services.AddScoped<AdminTaskService>();
builder.Services.AddScoped<ProjectService>();

// Cron Job: Auto-stop running tasks after 8 hours
builder.Services.AddHostedService<TaskCronJob>();

// 3. Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// 4. Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 5. CORS for Angular + Chrome Extension
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularAndChromeExtension", policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "https://time-tracking-jay-kalariya-projects.vercel.app",
            "chrome-extension://noedcggpeiiilpolnlleicbknicgfkaj"
        )
        .WithHeaders("Content-Type", "Authorization")
        .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .AllowCredentials();
    });
});

// 6. JWT Auth Setup
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var secretKey = Encoding.UTF8.GetBytes(configuration["Jwt:SecretKey"]!);
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = configuration["Jwt:Issuer"],
        ValidAudience = configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(secretKey)
    };
});

// 7. Authorization
builder.Services.AddAuthorization();

var app = builder.Build();

// 8. Auto-seed Admin
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TimeTrackingContext>();
    if (!db.Users.Any(u => u.Role == "Admin"))
    {
        var admin = new User
        {
            Username = "admin",
            Email = "admin@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = "Admin"
        };
        db.Users.Add(admin);
        db.SaveChanges();
        Console.WriteLine("✅ Admin user seeded: admin@example.com / Admin@123");
    }
}

// 9. Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// NOTE: Do NOT use HTTPS redirection on platforms like Render
app.UseRouting();

app.UseCors("AllowAngularAndChromeExtension");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
