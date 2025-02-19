from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from app.db.base_class import Base
from datetime import datetime

class TaskStatus(Base):
    __tablename__ = "task_status"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String, nullable=False)
    status = Column(String, nullable=False)  # pending, processing, completed, failed
    resource_id = Column(Integer, nullable=False)  # e.g., pension_id
    error = Column(String, nullable=True)
    task_metadata = Column(JSON, nullable=True)  # Store additional task-specific data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 