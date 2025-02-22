from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging

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

@app.get("/health")
async def health_check():
    logger.debug("Health check endpoint called")
    return {"status": "healthy"}
