from celery import Celery
from celery.schedules import crontab
from celery.signals import after_setup_logger
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from app.core.config import settings

@after_setup_logger.connect
def setup_celery_logging(logger, *args, **kwargs):
    """Configure Celery logging to use our application's logging setup"""
    # Remove default handlers
    logger.handlers = []
    
    # Create formatter
    formatter = logging.Formatter(settings.LOG_FORMAT)
    
    # Add handler for tasks.log
    tasks_log = Path(settings.LOG_DIR) / "tasks.log"
    handler = RotatingFileHandler(
        tasks_log,
        maxBytes=settings.LOG_FILE_MAX_BYTES,
        backupCount=settings.LOG_FILE_BACKUP_COUNT
    )
    handler.setFormatter(formatter)
    handler.setLevel(settings.LOG_LEVEL)
    logger.addHandler(handler)
    
    # Also log to console in development
    console = logging.StreamHandler()
    console.setFormatter(formatter)
    console.setLevel(settings.LOG_LEVEL)
    logger.addHandler(console)

celery_app = Celery(
    "worker",
    broker="redis://192.168.0.20:6379/0",
    backend="redis://192.168.0.20:6379/1",
    include=["app.tasks"],
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=10,
    broker_connection_retry=True,
    broker_pool_limit=None,  # Use unlimited pool size
)

# Optional configurations
celery_app.conf.update(
    task_track_started=True,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Schedule tasks
celery_app.conf.beat_schedule = {
    'update-daily-rates': {
        'task': 'app.tasks.exchange_rates.update_exchange_rates',
        'schedule': crontab(hour=16, minute=30),  # 16:30 UTC (after ECB update)
        'args': ('daily',)
    },
    'cleanup-old-updates': {
        'task': 'app.tasks.exchange_rates.cleanup_old_updates',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight UTC
    },
    'cleanup-old-etf-updates': {
        'task': 'app.tasks.etf.cleanup_old_updates',
        'schedule': crontab(hour=1, minute=0),  # Daily at 1 AM UTC
    },
    'retry-pending-etf-pension-calculations': {
        'task': 'app.tasks.etf_pension.retry_pending_calculations',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM UTC
    }
}