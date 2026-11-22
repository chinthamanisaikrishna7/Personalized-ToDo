FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

# Restore each project separately from source files to reuse Docker's dependency cache.
COPY src/Todo.API/Todo.API.csproj src/Todo.API/
COPY src/Todo.Application/Todo.Application.csproj src/Todo.Application/
COPY src/Todo.Domain/Todo.Domain.csproj src/Todo.Domain/
COPY src/Todo.Infrastructure/Todo.Infrastructure.csproj src/Todo.Infrastructure/
RUN dotnet restore src/Todo.API/Todo.API.csproj

COPY src/ src/
RUN dotnet publish src/Todo.API/Todo.API.csproj -c Release -o /publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /publish/ ./
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Todo.API.dll"]
