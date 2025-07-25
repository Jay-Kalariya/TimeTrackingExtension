using Dotnet1;
using Dotnet1.Services;
using Dotnet1.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Load configuration from appsettings.json
var configuration = builder.Configuration;

// 1. Register MySQL DbContext
builder.Services.AddDbContext<TimeTrackingContext>(options =>
    options.UseMySql(configuration.GetConnectionString("DefaultConnection"),
        new MySqlServerVersion(new Version(8, 0, 36))));

// 2. Register application services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<TaskService>();
builder.Services.AddScoped<AdminTaskService>();
builder.Services.AddScoped<ProjectService>();
// Cron job background service
builder.Services.AddHostedService<TaskCronJob>();


// 3. Register controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// 4. Enable Swagger in development only
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 5. Configure CORS for Angular & Chrome Extension (both local + hosted)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularAndChromeExtension", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                "https://time-tracking-jay-kalariya-projects.vercel.app",
                "chrome-extension://noedcggpeiiilpolnlleicbknicgfkaj"
            )
            .WithHeaders("Content-Type", "Authorization")
            .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .AllowCredentials();
    });
});


// 6. JWT Authentication Setup
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

// 7. Add Authorization
builder.Services.AddAuthorization();

var app = builder.Build();
// var builder = WebApplication.CreateBuilder(args);

// 8. Auto-seed admin user if not exists
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

// 9. Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// NOTE: Do NOT use HTTPS redirection in Render (it already uses HTTPS)
// app.UseHttpsRedirection();
app.UseRouting(); // ✅ Add this

app.UseCors("AllowAngularAndChromeExtension");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
