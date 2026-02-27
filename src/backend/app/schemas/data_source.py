from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class DataSourceConfigBase(BaseModel):
    name: str
    enabled: bool = True
    api_key: Optional[str] = None
    priority: int = 100
    requires_api_key: bool = False
    supports_search: bool = False
    extra_config: Optional[Any] = None


class DataSourceConfigResponse(DataSourceConfigBase):
    source_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DataSourceConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    api_key: Optional[str] = None
    priority: Optional[int] = None
    extra_config: Optional[Any] = None


class DataSourcePriorityItem(BaseModel):
    source_id: str
    priority: int


class DataSourcePrioritiesUpdate(BaseModel):
    priorities: list[DataSourcePriorityItem]


class DataSourceTestResult(BaseModel):
    source_id: str
    success: bool
    message: str
    latency_ms: Optional[int] = None


class ETFSourceSymbolResponse(BaseModel):
    id: int
    etf_id: str
    source_id: str
    symbol: str
    verified: bool
    last_verified_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
