from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import and_
from fastapi.encoders import jsonable_encoder
from app.crud.base import CRUDBase
from app.models.pension import (
    BasePension,
    ETFPension,
    InsurancePension,
    CompanyPension,
    PensionContribution,
    ContributionStep,
    PensionType
)
from app.schemas.pension import (
    PensionBase,
    ETFPensionCreate,
    InsurancePensionCreate,
    CompanyPensionCreate,
    ContributionBase,
    ContributionStepBase,
    ETFPensionUpdate,
    InsurancePensionUpdate,
    CompanyPensionUpdate
)
from app.crud.etf import etf_crud
from app.services.yfinance import get_etf_data
from app.schemas.etf import ETFCreate
from sqlalchemy.types import Enum

class CRUDPension(CRUDBase[BasePension, PensionBase, PensionBase]):
    def create_etf_pension(
        self, db: Session, *, obj_in: ETFPensionCreate
    ) -> BasePension:
        # First check if ETF exists
        etf = etf_crud.get(db, id=obj_in.etf_id)
        
        if not etf:
            # Fetch ETF data from YFinance
            yf_data = get_etf_data(obj_in.etf_id)
            if not yf_data:
                raise ValueError(f"ETF {obj_in.etf_id} not found in YFinance")
            
            # Create ETF with the fetched data
            etf_in = ETFCreate(
                id=yf_data["symbol"],
                symbol=yf_data["symbol"],
                name=yf_data.get("longName") or yf_data.get("shortName") or yf_data["symbol"],
                currency=yf_data.get("currency", "USD"),
                asset_class="Equity",  # Default value
                domicile="Unknown",    # Default value
                fund_size=yf_data.get("fund_size", 0),
                ter=yf_data.get("ter", 0),
                distribution_policy="Unknown",
                last_price=yf_data.get("regularMarketPrice", 0),
                ytd_return=yf_data.get("ytd_return", 0),
                one_year_return=yf_data.get("one_year_return", 0),
                volatility_30d=yf_data.get("volatility_30d", 0),
                sharpe_ratio=yf_data.get("sharpe_ratio", 0)
            )
            etf = etf_crud.create(db, obj_in=etf_in)

        # Create the pension
        obj_in_data = jsonable_encoder(obj_in)
        contribution_plan = obj_in_data.pop("contribution_plan", [])
        db_obj = ETFPension(**obj_in_data)
        
        # Add contribution steps
        for step in contribution_plan:
            db_obj.contribution_plan.append(ContributionStep(**step))

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_insurance_pension(
        self, db: Session, *, obj_in: InsurancePensionCreate
    ) -> BasePension:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = InsurancePension(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_company_pension(
        self, db: Session, *, obj_in: CompanyPensionCreate
    ) -> BasePension:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = CompanyPension(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def add_contribution(
        self, db: Session, *, pension_id: int, obj_in: ContributionBase
    ) -> PensionContribution:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = PensionContribution(**obj_in_data, pension_id=pension_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_contributions(
        self, db: Session, *, pension_id: int, skip: int = 0, limit: int = 100
    ) -> List[PensionContribution]:
        return (
            db.query(PensionContribution)
            .filter(PensionContribution.pension_id == pension_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_pension_with_details(
        self, db: Session, *, skip: int = 0, limit: int = 100, filters: Dict = None
    ) -> List[BasePension]:
        """
        Get pensions with their type-specific details using polymorphic loading
        """
        query = db.query(BasePension)
        
        if filters:
            for field, value in filters.items():
                query = query.filter(getattr(BasePension, field) == value)
        
        # For ETF pensions, load the ETF relationship and contribution plan
        query = query.options(
            selectinload(ETFPension.etf),
            selectinload(BasePension.contribution_plan)
        )
        
        return query.offset(skip).limit(limit).all()

    def update_etf_pension(
        self, db: Session, *, db_obj: ETFPension, obj_in: Union[Dict[str, Any], ETFPensionUpdate]
    ) -> BasePension:
        """Update an ETF pension plan."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        # Handle contribution plan updates if present
        if "contribution_plan" in update_data:
            contribution_plan = update_data.pop("contribution_plan")
            # Remove existing steps
            for step in db_obj.contribution_plan:
                db.delete(step)
            # Add new steps
            for step in contribution_plan:
                db_obj.contribution_plan.append(ContributionStep(**step))

        # If ETF ID is being updated, verify the new ETF exists or create it
        if "etf_id" in update_data:
            etf = etf_crud.get(db, id=update_data["etf_id"])
            if not etf:
                # Fetch ETF data from YFinance
                yf_data = get_etf_data(update_data["etf_id"])
                if not yf_data:
                    raise ValueError(f"ETF {update_data['etf_id']} not found in YFinance")
                
                # Create ETF with the fetched data
                etf_in = ETFCreate(
                    id=yf_data["symbol"],
                    symbol=yf_data["symbol"],
                    name=yf_data.get("longName") or yf_data.get("shortName") or yf_data["symbol"],
                    currency=yf_data.get("currency", "USD"),
                    asset_class="Equity",  # Default value
                    domicile="Unknown",    # Default value
                    fund_size=yf_data.get("fund_size", 0),
                    ter=yf_data.get("ter", 0),
                    distribution_policy="Unknown",
                    last_price=yf_data.get("regularMarketPrice", 0),
                    ytd_return=yf_data.get("ytd_return", 0),
                    one_year_return=yf_data.get("one_year_return", 0),
                    volatility_30d=yf_data.get("volatility_30d", 0),
                    sharpe_ratio=yf_data.get("sharpe_ratio", 0)
                )
                etf_crud.create(db, obj_in=etf_in)

        for field in update_data:
            setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_insurance_pension(
        self, db: Session, *, db_obj: InsurancePension, obj_in: Union[Dict[str, Any], InsurancePensionUpdate]
    ) -> BasePension:
        """Update an insurance pension plan."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        for field in update_data:
            setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_company_pension(
        self, db: Session, *, db_obj: CompanyPension, obj_in: Union[Dict[str, Any], CompanyPensionUpdate]
    ) -> BasePension:
        """Update a company pension plan."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        for field in update_data:
            setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

pension_crud = CRUDPension(BasePension)