from typing import Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.settings import Settings
from app.schemas.settings import SettingsCreate, SettingsUpdate

class CRUDSettings(CRUDBase[Settings, SettingsCreate, SettingsUpdate]):
    """CRUD operations for settings."""
    
    def get_settings(self, db: Session) -> Optional[Settings]:
        """Get the global settings. There should only be one settings record."""
        return db.query(self.model).first()

    def create_default_settings(self, db: Session) -> Settings:
        """Create default settings if none exist."""
        existing = self.get_settings(db)
        if existing:
            return existing

        default_settings = SettingsCreate(
            ui_locale="en-US",
            number_locale="en-US",
            currency="USD"
        )
        return self.create(db, obj_in=default_settings)

    def update_settings(
        self,
        db: Session,
        *,
        obj_in: SettingsUpdate
    ) -> Settings:
        """Update global settings. Creates default settings if none exist."""
        db_obj = self.get_settings(db)
        if not db_obj:
            # If no settings exist, create default ones first
            db_obj = self.create_default_settings(db)
        
        return self.update(db, db_obj=db_obj, obj_in=obj_in)

# Create a singleton instance
settings = CRUDSettings(Settings) 