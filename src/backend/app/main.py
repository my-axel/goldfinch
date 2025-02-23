from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.startup import check_and_trigger_updates

# Initialize logging
setup_logging()

# Create logger for this module
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Goldfinch API",
    description="Backend API for Goldfinch retirement planning",
    version="1.0.0",
    redirect_slashes=False
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """Run startup tasks when the application starts."""
    logger.info("Running application startup tasks...")
    # Run startup checks in the background to avoid delaying app startup
    from fastapi.concurrency import run_in_threadpool
    await run_in_threadpool(check_and_trigger_updates)
    logger.info("Startup tasks completed")

@app.get("/health")
async def health_check():
    logger.debug("Health check endpoint called")
    return {"status": "healthy"}
