from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from fastapi.concurrency import run_in_threadpool

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.startup import check_and_trigger_updates
from app.core.telemetry import setup_telemetry
from app.db.session import engine

# Initialize logging
setup_logging()

# Create logger for this module
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    # Startup
    logger.info("=== Running application startup tasks... ===")
    await run_in_threadpool(check_and_trigger_updates)
    logger.info("=== Startup tasks completed ===")
    yield
    # Shutdown (if needed)
    logger.info("=== Application shutting down... ===")

app = FastAPI(
    title="Goldfinch API",
    description="Backend API for Goldfinch retirement planning",
    version="1.0.0",
    redirect_slashes=False,
    lifespan=lifespan
)

# Set up SigNoz telemetry (if configured)
# Pass the SQLAlchemy engine for database monitoring
tracer = setup_telemetry(app, engine)
if tracer:
    logger.info("SigNoz telemetry initialized")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://127.0.0.1:54640"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    logger.debug("Health check endpoint called")
    return {"status": "healthy"}
