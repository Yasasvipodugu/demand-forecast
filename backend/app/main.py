import sys
from pathlib import Path

# Ensure backend root is always on sys.path regardless of deployment working directory
BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router, ensure_models_trained
from app.auth.routes import auth_router
from app.auth.storage import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("LaunchWise AI backend is starting...")
    init_db()
    # Initialize and pre-train models in background worker thread so port binds instantly
    asyncio.create_task(asyncio.to_thread(ensure_models_trained))
    print("LaunchWise AI backend is ready and listening on http://127.0.0.1:8000")
    yield

app = FastAPI(
    title="LaunchWise AI — Intelligent New Product Demand Forecasting",
    description="Cold-start demand forecasting and Newsvendor inventory optimization platform for retail merchandising.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)

from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check for built frontend in frontend/dist or docs
BASE_DIR = Path(__file__).resolve().parent.parent.parent
frontend_dist = BASE_DIR / "frontend" / "dist"
if not frontend_dist.exists() or not (frontend_dist / "index.html").exists():
    frontend_dist = BASE_DIR / "docs"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes or docs
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_path = frontend_dist / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "service": "LaunchWise AI Backend",
            "tagline": "Predict demand. Plan purchases. Manage inventory smarter.",
            "version": "1.0.0",
            "docs_url": "/docs",
            "health_check": "/api/health"
        }
