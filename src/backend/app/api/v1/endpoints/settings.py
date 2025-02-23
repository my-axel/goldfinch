from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.crud.settings import settings
from app.schemas.settings import Settings, SettingsUpdate
from app.db.session import get_db

router = APIRouter()

@router.get("", response_model=Settings)
def get_settings(db: Session = Depends(get_db)):
    """
    Retrieve global settings.
    Creates and returns default settings if none exist.
    """
    try:
        db_settings = settings.get_settings(db)
        if not db_settings:
            db_settings = settings.create_default_settings(db)
        return db_settings
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve settings"
        )

@router.put("", response_model=Settings)
def update_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db)
):
    """
    Update global settings.
    Creates default settings first if none exist.
    """
    try:
        return settings.update_settings(db=db, obj_in=settings_update)
    except ValueError as e:
        # Handle validation errors from Pydantic
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Could not update settings"
        ) 