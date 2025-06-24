# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0-preview AS build
WORKDIR /src

# Copy entire source
COPY . .

# Set working directory to project folder
WORKDIR /src/Dotnet1

# Restore and publish the app
RUN dotnet restore Dotnet1.csproj
RUN dotnet publish Dotnet1.csproj -c Release -o /app/out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0-preview
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "Dotnet1.dll"]
