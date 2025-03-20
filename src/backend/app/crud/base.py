from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload
from app.db.base_class import Base
import logging

logger = logging.getLogger("app.crud.base")

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).
        **Parameters**
        * `model`: A SQLAlchemy model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """Get a record by ID with all relationships loaded efficiently."""
        # Get all relationship names from the model
        relationships = getattr(self.model, '__mapper__').relationships.keys()
        
        # Build query with selectinload for all relationships
        query = db.query(self.model)
        for rel in relationships:
            query = query.options(selectinload(getattr(self.model, rel)))
            
        return query.filter(self.model.id == id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100, filters: Dict = None
    ) -> List[ModelType]:
        """Get multiple records with all relationships loaded efficiently."""
        # Get all relationship names from the model
        relationships = getattr(self.model, '__mapper__').relationships.keys()
        
        # Build query with selectinload for all relationships
        query = db.query(self.model)
        for rel in relationships:
            query = query.options(selectinload(getattr(self.model, rel)))
            
        if filters:
            for field, value in filters.items():
                query = query.filter(getattr(self.model, field) == value)
                
        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record."""
        logger.debug(f"BASE: Creating new {self.model.__name__}")
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)  # type: ignore
        db.add(db_obj)
        db.commit()
        
        # Instead of using db.refresh which can cause recursion,
        # query the object with specific relationships
        logger.debug(f"BASE: Getting created {self.model.__name__} with focused query")
        relationships = getattr(self.model, '__mapper__').relationships.keys()
        
        query = db.query(self.model)
        for rel in relationships:
            query = query.options(selectinload(getattr(self.model, rel)))
            
        created_obj = query.filter(self.model.id == db_obj.id).first()
        logger.debug(f"BASE: Successfully created {self.model.__name__} with ID: {created_obj.id}")
        
        return created_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Update a record."""
        logger.debug(f"BASE: Updating {self.model.__name__} with ID: {db_obj.id}")
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
            
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        db.commit()
        
        # Instead of using db.refresh which can cause recursion,
        # query the object with specific relationships
        logger.debug(f"BASE: Getting updated {self.model.__name__} with focused query")
        relationships = getattr(self.model, '__mapper__').relationships.keys()
        
        query = db.query(self.model)
        for rel in relationships:
            query = query.options(selectinload(getattr(self.model, rel)))
            
        updated_obj = query.filter(self.model.id == db_obj.id).first()
        logger.debug(f"BASE: Successfully updated {self.model.__name__} with ID: {updated_obj.id}")
        
        return updated_obj

    def remove(self, db: Session, *, id: int) -> ModelType:
        """Remove a record."""
        logger.debug(f"BASE: Removing {self.model.__name__} with ID: {id}")
        obj = db.get(self.model, id)
        db.delete(obj)
        db.commit()
        logger.debug(f"BASE: Successfully removed {self.model.__name__} with ID: {id}")
        return obj