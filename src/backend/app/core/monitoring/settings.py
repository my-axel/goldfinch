"""
Configuration settings for application monitoring with SigNoz.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pathlib import Path

# Try to find the project root directory
def find_project_root() -> Path:
    """Find the project root directory containing the .env.signoz file"""
    current_dir = Path.cwd()
    
    # Try up to 3 parent directories to find the .env.signoz file
    for _ in range(4):
        if (current_dir / ".env.signoz").exists():
            return current_dir
        if (current_dir / "src" / "backend" / ".env.signoz").exists():
            return current_dir / "src" / "backend"
        current_dir = current_dir.parent
    
    # Default to the current directory if not found
    return Path.cwd()

class MonitoringSettings(BaseSettings):
    """
    Configuration settings for application monitoring with SigNoz.
    All settings default to values that ensure monitoring is disabled
    unless explicitly configured.
    """
    ENABLE_SIGNOZ: bool = False
    SIGNOZ_ENDPOINT: str | None = None
    SIGNOZ_SERVICE_NAME: str = "goldfinch-backend"
    SIGNOZ_ENVIRONMENT: str = "development"
    SIGNOZ_INSECURE: bool = True  # Set to False for HTTPS
    
    # Log settings
    ENABLE_SIGNOZ_LOGS: bool = False
    SIGNOZ_LOG_LEVEL: str = "INFO"  # Default log level for SigNoz logs
    SIGNOZ_LOG_BATCH_SIZE: int = 10  # Number of logs to batch before sending

    model_config = {
        "env_prefix": "GOLDFINCH_",
        "case_sensitive": True,
        # Try to find the .env.signoz file in the project
        "env_file": str(find_project_root() / ".env.signoz"),
        "env_file_encoding": "utf-8",
        # Fallback to environment variables if file not found
        "env_ignore_missing": True
    }

@lru_cache()
def get_monitoring_settings() -> MonitoringSettings:
    """
    Returns monitoring settings, cached to avoid repeated env var lookups.
    """
    return MonitoringSettings() 