using System.Diagnostics;
using Microsoft.Extensions.Hosting;

namespace Todo.API.Development;

// Runs only when explicitly enabled by a local development launch profile.
public sealed class FrontendDevServer(IHostEnvironment environment, ILogger<FrontendDevServer> logger) : IHostedService, IDisposable
{
    private Process? process;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var frontendPath = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "..", "Todo.Web"));
        if (!Directory.Exists(Path.Combine(frontendPath, "node_modules")))
        {
            logger.LogWarning("Frontend dependencies are missing. Run npm install in {FrontendPath} and restart the API.", frontendPath);
            return Task.CompletedTask;
        }

        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = OperatingSystem.IsWindows() ? "cmd.exe" : "npm",
                WorkingDirectory = frontendPath,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };
            if (OperatingSystem.IsWindows())
            {
                startInfo.ArgumentList.Add("/d");
                startInfo.ArgumentList.Add("/c");
                startInfo.ArgumentList.Add("npm.cmd");
            }
            startInfo.ArgumentList.Add("run");
            startInfo.ArgumentList.Add("dev");
            process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };
            process.OutputDataReceived += (_, e) => { if (e.Data is not null) logger.LogInformation("Frontend: {Message}", e.Data); };
            process.ErrorDataReceived += (_, e) => { if (e.Data is not null) logger.LogWarning("Frontend: {Message}", e.Data); };
            process.Exited += (_, _) => logger.LogWarning("Frontend development server exited. Check its output; port 5173 may already be in use.");
            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            logger.LogInformation("Starting the frontend at http://localhost:5173; wait for the Vite ready message.");
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or InvalidOperationException)
        {
            logger.LogWarning(ex, "Could not start the frontend. Check that Node.js and npm are installed and on PATH.");
        }
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        try { if (process is { HasExited: false }) process.Kill(entireProcessTree: true); }
        catch (InvalidOperationException) { }
        return Task.CompletedTask;
    }

    public void Dispose() => process?.Dispose();
}
