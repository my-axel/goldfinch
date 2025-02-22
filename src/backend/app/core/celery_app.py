from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "worker",
    broker="amqp://guest:guest@localhost:5672//",
    backend="rpc://",
    include=["app.tasks"],  # Using __init__.py to handle task registration
    broker_connection_retry_on_startup=True
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
    }
}