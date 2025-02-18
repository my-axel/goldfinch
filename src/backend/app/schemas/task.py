from pydantic import BaseModel
from datetime import datetime

class TaskStatusResponse(BaseModel):
    id: int
    task_type: str
    status: str
    resource_id: int
    error: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 