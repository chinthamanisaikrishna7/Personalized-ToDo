# Personal To-do List

A CQRS/MediatR ASP.NET Core API with a separate React client in `src/Todo.Web`.

## Set up SQL Server

Run `database/setup.sql` in SQL Server Management Studio, connected to your SQL Server instance. It creates `CqrsTodo` and `dbo.Todos` if they do not exist. It does not delete data or modify an existing table. It is a first-time setup script, not a migration tool; future schema changes need separate migrations. Your SQL login needs permission to create the database and table.

## Run locally without Docker

Install the .NET 10 SDK and Node.js. Configure `ConnectionStrings:TodoDb` for your SQL Server instance using ASP.NET Core user secrets or environment variables.

1. Run the API: `dotnet run --project src/Todo.API --launch-profile http` (HTTP on `http://localhost:5051`).
2. Run `npm install` and `npm run dev` in `src/Todo.Web`, then visit `http://localhost:5173`.

The Vite development server forwards `/api` requests to the API. Search and status filters operate on the loaded list in the browser.

## Run both services with Docker Compose

Prerequisites: Docker Desktop with Linux containers running, plus SQL Server on your host initialized with `database/setup.sql`. Compose does not start SQL Server or create the schema.

Create a `.env` file in the repository root with the following values, replacing the login, password, and port. Keep it private and never commit it:

```env
TODO_DB_CONNECTION=Server=host.docker.internal,1433;Database=CqrsTodo;User Id=YOUR_SQL_LOGIN;Password=YOUR_SQL_PASSWORD;TrustServerCertificate=True;
DOCKERHUB_USERNAME=chinthamanisaikrishna
IMAGE_TAG=latest
WEB_PORT=8080
```

Use `host.docker.internal` instead of `localhost` because `localhost` inside the API container refers to the container itself. The example assumes SQL authentication and TCP port 1433. A SQL Server Express named instance may use a different or dynamic port. Enable TCP/IP and configure or discover a reachable TCP port in SQL Server Configuration Manager; restart SQL Server if you change it. Windows Integrated Authentication is not covered by this example.

From the repository root, run `docker compose up --build -d`, then open `http://localhost:8080` (or your configured `WEB_PORT`). This starts the API and web containers. Nginx serves the built React files and forwards `/api` requests to the API on the Compose network. `docker compose up --build -d web` also starts the API dependency. The startup order does not guarantee database readiness; retry if SQL Server is still starting.

Use `docker compose logs -f` to inspect logs and `docker compose down` to stop the containers. Your SQL Server data remains on your host. For hot reload use the non-Docker development commands above.

## Docker Hub publishing

To publish manually, run `docker login`, `docker compose build`, and `docker compose push`. The Compose image names use `DOCKERHUB_USERNAME` and `IMAGE_TAG` from `.env`.

On each push to `main`, `.github/workflows/publish-images.yml` builds both images and pushes their `latest` tags to Docker Hub. In GitHub, open the repository Settings, then Secrets and variables, then Actions; add a repository secret named `DOCKERHUB_TOKEN` containing a Docker Hub access token with write access. The workflow uses the Docker Hub username `chinthamanisaikrishna`. Never commit the token or put it in the workflow file.

Publishing an image does not automatically update or restart a running deployment; pull the new image and restart containers on the deployment host. A deployment must provide its own connection string and reachable SQL Server. The web image expects the backend at `api:8080` as it is in Compose; other platforms need equivalent service discovery or an updated Nginx configuration. Containers use HTTP internally. The API has no authentication; add access controls and TLS before exposing it publicly.
