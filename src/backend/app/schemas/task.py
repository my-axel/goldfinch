from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TaskStatusResponse(BaseModel):
    id: int
    task_type: str
    status: str
    resource_id: int
    error: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True) 