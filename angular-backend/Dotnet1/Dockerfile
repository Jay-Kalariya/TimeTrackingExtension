# Use the .NET 9.0 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0-preview AS build
WORKDIR /src

# Copy everything into the container
COPY . .

# ✅ Run restore and publish from the root, where Dotnet1.csproj exists
RUN dotnet restore Dotnet1.csproj
RUN dotnet publish Dotnet1.csproj -c Release -o /app/out

# Use the ASP.NET Core runtime image for running the app
FROM mcr.microsoft.com/dotnet/aspnet:9.0-preview AS runtime
WORKDIR /app
COPY --from=build /app/out .

# Set environment variables and expose port 80
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

# Start the application
ENTRYPOINT ["dotnet", "Dotnet1.dll"]
