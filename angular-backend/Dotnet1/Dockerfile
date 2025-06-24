# Use .NET 9.0 SDK image for build
FROM mcr.microsoft.com/dotnet/sdk:9.0-preview AS build
WORKDIR /src

# Copy everything into the container
COPY . .

# Set working directory to the project folder (where .csproj exists)
WORKDIR /src/Dotnet1

# Restore and publish the application
RUN dotnet restore
RUN dotnet publish -c Release -o /app/out

# Build the runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0-preview
WORKDIR /app
COPY --from=build /app/out .

# Set environment and expose port
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

# Entry point to run your app
ENTRYPOINT ["dotnet", "Dotnet1.dll"]
