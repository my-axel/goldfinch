from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Goldfinch"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings() 