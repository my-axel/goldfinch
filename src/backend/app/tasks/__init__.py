from app.core.celery_app import celery_app

# Import all task modules here
from . import etf
from . import etf_pension

# This makes the celery app and tasks available
__all__ = ["celery_app", "etf", "etf_pension"]