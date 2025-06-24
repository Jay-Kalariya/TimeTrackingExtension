# Use official .NET SDK image to build
FROM mcr.microsoft.com/dotnet/sdk:9.0-preview AS build
WORKDIR /src

# Copy everything into the container
COPY . .

# Set working directory to where the .csproj file is
WORKDIR /src/Dotnet1

# Restore and publish
RUN dotnet restore
RUN dotnet publish -c Release -o /app/out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0-preview
WORKDIR /app
COPY --from=build /app/out .

# Set environment and port
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

# Start the app
ENTRYPOINT ["dotnet", "Dotnet1.dll"]
