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

@app.get("/")
def root():
    return {
        "service": "LaunchWise AI Backend",
        "tagline": "Predict demand. Plan purchases. Manage inventory smarter.",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }
