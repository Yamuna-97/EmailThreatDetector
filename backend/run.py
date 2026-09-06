import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

if __name__ == "__main__":
    if ENVIRONMENT == "production":
        # Production: gunicorn with uvicorn workers (used on Render)
        # Render injects PORT automatically — read it here.
        import subprocess
        workers = int(os.getenv("WEB_CONCURRENCY", 2))
        cmd = [
            "gunicorn",
            "-k", "uvicorn.workers.UvicornWorker",
            "-w", str(workers),
            "-b", f"{HOST}:{PORT}",
            "--timeout", "120",
            "--graceful-timeout", "30",
            "--access-logfile", "-",
            "--error-logfile", "-",
            "app.main:app",
        ]
        subprocess.run(cmd)
    else:
        # Development: uvicorn with auto-reload
        import uvicorn
        uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
