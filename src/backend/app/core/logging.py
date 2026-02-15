"""
Simple logging configuration for Goldfinch.
Provides basic stdout and file logging without external monitoring dependencies.
"""
import logging
import logging.handlers
import sys
from pathlib import Path
from app.core.config import settings


def setup_logging():
    """
    Set up basic application-wide logging.

    Features:
    - Console output (stdout)
    - Rotating file logs
    - Configurable log level
    - Component-specific log files
    """
    # Create formatter
    formatter = logging.Formatter(
        settings.LOG_FORMAT,
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(settings.LOG_LEVEL)

    # Remove any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Console handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(settings.LOG_LEVEL)
    root_logger.addHandler(console_handler)

    # File handler for main application log
    main_log_file = Path(settings.LOG_DIR) / "goldfinch.log"
    main_log_file.parent.mkdir(parents=True, exist_ok=True)

    file_handler = logging.handlers.RotatingFileHandler(
        main_log_file,
        maxBytes=settings.LOG_FILE_MAX_BYTES,
        backupCount=settings.LOG_FILE_BACKUP_COUNT
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(settings.LOG_LEVEL)
    root_logger.addHandler(file_handler)

    logging.info("✅ Goldfinch logging initialized")


# Initialize logging when module is imported
setup_logging()
