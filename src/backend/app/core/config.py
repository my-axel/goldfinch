from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Goldfinch"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    DATABASE_URL: str = "postgresql+psycopg2://goldfinch_dev:changeme@localhost:5432/goldfinch_dev"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    BASE_CURRENCY: str = "EUR"
    CURRENCY_DECIMALS: int = 2  # Number of decimal places for currency values
    
    # Logging configuration
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_DIR: str = str(Path(__file__).parent.parent.parent / "logs")
    LOG_FILE_MAX_BYTES: int = 10_000_000  # 10MB
    LOG_FILE_BACKUP_COUNT: int = 5

    model_config = {
        "env_file": str(Path(__file__).parent.parent.parent.parent.parent / ".env"),
        "extra": "ignore",
    }

settings = Settings()

# Ensure log directory exists
os.makedirs(settings.LOG_DIR, exist_ok=True) 