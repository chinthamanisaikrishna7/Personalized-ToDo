# Personal To-do List

A CQRS/MediatR ASP.NET Core API with a separate React client in `src/Todo.Web`.

## Run locally

1. Configure `ConnectionStrings:TodoDb` for your SQL Server instance using ASP.NET Core user secrets or environment variables. The database and `Todos` table must already exist; the project does not currently include migrations or automatic database creation.
2. Run the API: `dotnet run --project src/Todo.API --launch-profile http` (HTTP on `http://localhost:5051`).
3. Run `npm install` and `npm run dev` in `src/Todo.Web`, then visit `http://localhost:5173`.

The development server proxies `/api` requests to the API. For a production frontend deployment, configure the web server to proxy `/api` to the API; the Vite development proxy does not run in production. The API also allows CORS from `http://localhost:5173`.

Run `npm run lint` and `npm run build` in `src/Todo.Web` to check and build the client. Search and status filters operate on the loaded list in the browser. The API has no authentication; do not expose it publicly without adding appropriate access controls.
