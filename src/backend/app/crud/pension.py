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
    ContributionStatus,
    PensionType,
    ETFAllocation,
    ContributionFrequency
)
from app.models.etf import ETFPrice
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
from app.schemas.etf import ETFCreate, ETFPriceCreate
from sqlalchemy.types import Enum
from decimal import Decimal
from datetime import datetime, date
from fastapi import HTTPException

class CRUDPension(CRUDBase[BasePension, PensionBase, PensionBase]):
    def _save_historical_prices(
        self, db: Session, etf_id: str, yf_data: Dict[str, Any], currency: str
    ) -> None:
        """
        Save historical prices for an ETF.
        Converts all prices to EUR before saving.
        """
        historical_prices = yf_data.get("historical_prices", [])
        
        for price_data in historical_prices:
            price_in = ETFPriceCreate(
                etf_id=etf_id,
                date=price_data["date"],
                price=Decimal(str(price_data["price"])),
                volume=price_data["volume"],
                high=price_data["high"],
                low=price_data["low"],
                open=price_data["open"],
                original_currency=currency
            )
            etf_crud.add_price(db, etf_id=etf_id, obj_in=price_in)

    def _create_planned_contributions_from_steps(
        self,
        db: Session,
        pension_id: int,
        contribution_steps: List[ContributionStep]
    ) -> None:
        """
        Create planned contributions in the pension_contributions table based on contribution steps.
        This ensures that historical contributions can be realized later.
        """
        # Get the pension to determine retirement date
        pension = (
            db.query(ETFPension)
            .filter(ETFPension.id == pension_id)
            .options(joinedload(ETFPension.member))
            .first()
        )
        if not pension:
            raise HTTPException(status_code=404, detail="Pension not found")
            
        # Get member's retirement date
        if not pension.member:
            raise HTTPException(status_code=404, detail="Member not found")
            
        # Calculate retirement date (default to 67 years if not set)
        retirement_age = pension.member.retirement_age_planned or 67
        retirement_date = pension.member.birthday.replace(year=pension.member.birthday.year + retirement_age)

        for step in contribution_steps:
            current_date = step.start_date
            # If no end date is provided, use retirement date
            end_date = step.end_date or retirement_date
            
            while current_date <= end_date:
                # Create a planned contribution for this date
                contribution = PensionContribution(
                    pension_id=pension_id,
                    date=current_date,
                    amount=step.amount,
                    planned_amount=step.amount,
                    status=ContributionStatus.PLANNED,
                    is_manual_override=False,
                    note=f"Generated from {step.frequency.lower()} contribution plan"
                )
                db.add(contribution)
                
                # Move to next contribution date based on frequency
                if step.frequency == ContributionFrequency.MONTHLY:
                    if current_date.month == 12:
                        current_date = current_date.replace(year=current_date.year + 1, month=1)
                    else:
                        current_date = current_date.replace(month=current_date.month + 1)
                elif step.frequency == ContributionFrequency.QUARTERLY:
                    if current_date.month >= 10:
                        current_date = current_date.replace(year=current_date.year + 1, month=(current_date.month + 3) % 12 or 12)
                    else:
                        current_date = current_date.replace(month=current_date.month + 3)
                elif step.frequency == ContributionFrequency.ANNUALLY:
                    current_date = current_date.replace(year=current_date.year + 1)
        
        db.commit()

    def create_etf_pension(
        self, db: Session, *, obj_in: ETFPensionCreate, background_tasks = None
    ) -> BasePension:
        # First check if ETF exists
        etf = etf_crud.get(db, id=obj_in.etf_id)
        
        if not etf:
            # Fetch basic ETF data from YFinance (without full history)
            yf_data = get_etf_data(obj_in.etf_id, interval="1d")
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
                last_update=datetime.utcnow(),
                ytd_return=yf_data.get("ytd_return", 0),
                one_year_return=yf_data.get("one_year_return", 0),
                volatility_30d=yf_data.get("volatility_30d", 0),
                sharpe_ratio=yf_data.get("sharpe_ratio", 0)
            )
            etf = etf_crud.create(db, obj_in=etf_in)
            
            # Save only the latest price for immediate use
            if yf_data.get("historical_prices"):
                latest_price = yf_data["historical_prices"][-1]
                price_in = ETFPriceCreate(
                    etf_id=etf.id,
                    date=latest_price["date"],
                    price=Decimal(str(latest_price["price"])),
                    volume=latest_price.get("volume"),
                    high=latest_price.get("high"),
                    low=latest_price.get("low"),
                    open=latest_price.get("open")
                )
                etf_crud.add_price(db, etf_id=etf.id, obj_in=price_in)
            
            # Schedule historical price fetching as background task if provided
            if background_tasks is not None:
                background_tasks.add_task(
                    etf_crud.refresh_full_history,
                    db,
                    etf.id
                )

        # Create the pension
        obj_in_data = jsonable_encoder(obj_in)
        contribution_plan = obj_in_data.pop("contribution_plan", [])
        
        # Remove fields that shouldn't go into the pension model
        is_existing = obj_in_data.pop("is_existing_investment", False)
        existing_units = obj_in_data.pop("existing_units", None)
        reference_date_str = obj_in_data.pop("reference_date", None)
        reference_date = date.fromisoformat(reference_date_str) if reference_date_str else None
        
        db_obj = ETFPension(**obj_in_data)
        
        # First add and commit the pension to get an ID
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Handle existing investment
        if is_existing and existing_units is not None:
            if not reference_date:
                raise HTTPException(
                    status_code=400,
                    detail="Reference date is required for existing investments"
                )
            db_obj.total_units = Decimal(str(existing_units))
            
            # Create an initial contribution to record the existing investment
            latest_price = etf_crud.get_price_for_date(db, etf_id=etf.id, date=reference_date)
            if not latest_price:
                # Try to fetch and save the price for reference date
                price_data = get_etf_data(etf.id, start_date=reference_date, end_date=reference_date)
                if price_data and price_data.get("historical_prices"):
                    latest_price = price_data["historical_prices"][0]
                    price_in = ETFPriceCreate(
                        etf_id=etf.id,
                        date=latest_price["date"],
                        price=latest_price["price"],
                        volume=latest_price.get("volume"),
                        high=latest_price.get("high"),
                        low=latest_price.get("low"),
                        open=latest_price.get("open")
                    )
                    latest_price = etf_crud.add_price(db, etf_id=etf.id, obj_in=price_in)
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"No price found for ETF {etf.id} on {reference_date}"
                    )

            # Calculate initial value based on units and price
            initial_value = Decimal(str(existing_units)) * latest_price.price
            db_obj.initial_capital = initial_value
            db_obj.current_value = initial_value

            # Create an initial contribution for the existing investment
            contribution = PensionContribution(
                pension_id=db_obj.id,  # Now we have a valid ID
                date=reference_date,
                amount=initial_value,
                planned_amount=initial_value,
                status=ContributionStatus.REALIZED,
                is_manual_override=True,
                note="Initial contribution for existing investment"
            )
            db.add(contribution)
            db.flush()  # Ensure contribution has an ID before creating allocation

            # Record the ETF allocation
            allocation = ETFAllocation(
                contribution_id=contribution.id,
                etf_id=etf.id,
                amount=initial_value,
                units_bought=Decimal(str(existing_units))
            )
            db.add(allocation)
        
        # Add contribution steps
        for step in contribution_plan:
            db_obj.contribution_plan.append(ContributionStep(**step))
            
        db.commit()
        db.refresh(db_obj)
        
        # Create planned contributions from the contribution steps
        self._create_planned_contributions_from_steps(
            db,
            db_obj.id,
            db_obj.contribution_plan
        )
        
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

    def _calculate_etf_units(
        self, db: Session, etf_id: str, amount: Decimal, contribution_date: date
    ) -> Decimal:
        """
        Calculate how many ETF units can be bought for a given amount on a specific date.
        If no price is available for the exact date, uses the next available price.
        """
        # Get the ETF price for the contribution date or the next available date
        price = (
            db.query(ETFPrice)
            .filter(
                ETFPrice.etf_id == etf_id,
                ETFPrice.date >= contribution_date
            )
            .order_by(ETFPrice.date)  # Get the earliest date after or equal to contribution_date
            .first()
        )
        
        if not price:
            raise HTTPException(
                status_code=400,
                detail=f"No price found for ETF {etf_id} on or after {contribution_date}"
            )
            
        # Calculate units (amount in EUR / price in EUR)
        return amount / Decimal(str(price.price))

    def add_contribution(
        self, db: Session, *, pension_id: int, obj_in: ContributionBase
    ) -> PensionContribution:
        # Get the pension to check its type
        pension = db.query(BasePension).filter(BasePension.id == pension_id).first()
        if not pension:
            raise HTTPException(status_code=404, detail="Pension not found")
            
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = PensionContribution(**obj_in_data, pension_id=pension_id)
        
        # For ETF pensions, calculate and store units bought
        if isinstance(pension, ETFPension):
            # Calculate units based on contribution amount and ETF price
            units = self._calculate_etf_units(
                db,
                pension.etf_id,
                Decimal(str(obj_in.amount)),
                obj_in.date
            )
            
            # Create ETF allocation
            allocation = ETFAllocation(
                contribution_id=db_obj.id,
                etf_id=pension.etf_id,
                amount=obj_in.amount,
                units_bought=units
            )
            db_obj.etf_allocations.append(allocation)
            
            # Update total units in the pension
            pension.total_units += units
            
            # Update current value based on latest ETF price
            latest_price = etf_crud.get_latest_price(db, etf_id=pension.etf_id)
            if latest_price:
                pension.current_value = pension.total_units * Decimal(str(latest_price.price))
        
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
        self, db: Session, *, skip: int = 0, limit: int = 100, filters: Dict = None, include_historical_prices: bool = False
    ) -> List[BasePension]:
        """
        Get pensions with their type-specific details using polymorphic loading.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Dictionary of field-value pairs to filter by
            include_historical_prices: Whether to include historical ETF prices (defaults to False)
        """
        query = db.query(BasePension)
        
        if filters:
            for field, value in filters.items():
                query = query.filter(getattr(BasePension, field) == value)
        
        # For ETF pensions, load the ETF relationship and contribution plan
        if include_historical_prices:
            query = query.options(
                selectinload(ETFPension.etf).selectinload(ETF.historical_prices),
                selectinload(BasePension.contribution_plan)
            )
        else:
            # Only load the ETF basic info and contribution plan when not including historical prices
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

    def add_one_time_investment(
        self, 
        db: Session, 
        *, 
        pension_id: int, 
        amount: Decimal,
        investment_date: date,
        user_note: Optional[str] = None
    ) -> PensionContribution:
        """
        Add a one-time investment to an ETF pension.
        This is used for special cases like bonuses or extra investments.
        
        Args:
            pension_id: ID of the pension plan
            amount: Amount to invest (in EUR)
            investment_date: When the investment was/will be made
            user_note: Optional note from the user explaining the investment
        """
        # Get the pension to check its type
        pension = db.query(BasePension).filter(BasePension.id == pension_id).first()
        if not pension:
            raise HTTPException(status_code=404, detail="Pension not found")
            
        if not isinstance(pension, ETFPension):
            raise HTTPException(
                status_code=400,
                detail="One-time investments are only supported for ETF pensions"
            )
            
        # Calculate units that can be bought
        units = self._calculate_etf_units(
            db,
            pension.etf_id,
            amount,
            investment_date
        )
        
        # Create the contribution
        note = f"One-time investment"
        if user_note:
            note += f" - {user_note}"
            
        contribution = PensionContribution(
            pension_id=pension_id,
            date=investment_date,
            amount=amount,
            planned_amount=amount,  # Same as amount since it's a direct investment
            status=ContributionStatus.REALIZED,
            is_manual_override=True,
            note=note
        )
        
        # Create the allocation
        allocation = ETFAllocation(
            contribution=contribution,
            etf_id=pension.etf_id,
            amount=amount,
            units_bought=units
        )
        
        contribution.etf_allocations.append(allocation)
        
        # Update pension's total units and current value
        pension.total_units += units
        latest_price = etf_crud.get_latest_price(db, etf_id=pension.etf_id)
        if latest_price:
            pension.current_value = pension.total_units * Decimal(str(latest_price.price))
        
        db.add(contribution)
        db.commit()
        db.refresh(contribution)
        return contribution

    def get_planned_contributions(
        self,
        db: Session,
        *,
        pension_id: int,
        end_date: date = None
    ) -> List[PensionContribution]:
        """
        Get all planned contributions for a pension up to a specific date.
        If no end_date is provided, uses current date.
        Only returns contributions that are still in PLANNED status.
        """
        if end_date is None:
            end_date = date.today()

        return (
            db.query(PensionContribution)
            .filter(
                PensionContribution.pension_id == pension_id,
                PensionContribution.status == ContributionStatus.PLANNED,
                PensionContribution.date <= end_date
            )
            .order_by(PensionContribution.date)
            .all()
        )

    def realize_historical_contributions(
        self,
        db: Session,
        *,
        pension_id: int,
        end_date: date = None
    ) -> List[PensionContribution]:
        """
        Realize all planned contributions up to a specific date.
        If no end_date is provided, uses current date.
        
        For each contribution:
        1. Calculates units based on historical prices (using next available price if needed)
        2. Updates contribution status to REALIZED
        3. Creates ETF allocations
        4. Updates pension's total units and current value
        
        Returns the list of realized contributions.
        """
        # Get the pension and verify it's an ETF pension
        pension = db.query(ETFPension).filter(ETFPension.id == pension_id).first()
        if not pension:
            raise HTTPException(
                status_code=404,
                detail="ETF Pension not found"
            )
            
        # Get all planned contributions up to end_date
        planned_contributions = self.get_planned_contributions(
            db,
            pension_id=pension_id,
            end_date=end_date
        )
        
        realized_contributions = []
        total_new_units = Decimal('0')
        
        for contribution in planned_contributions:
            try:
                # Get the actual price date that will be used
                price = (
                    db.query(ETFPrice)
                    .filter(
                        ETFPrice.etf_id == pension.etf_id,
                        ETFPrice.date >= contribution.date
                    )
                    .order_by(ETFPrice.date)
                    .first()
                )
                
                if not price:
                    # Skip if no price is available at all
                    continue
                
                # Calculate units for this contribution
                units = self._calculate_etf_units(
                    db,
                    pension.etf_id,
                    Decimal(str(contribution.amount)),
                    contribution.date
                )
                
                # Create ETF allocation
                allocation = ETFAllocation(
                    contribution_id=contribution.id,
                    etf_id=pension.etf_id,
                    amount=contribution.amount,
                    units_bought=units
                )
                
                # Update contribution status and note
                contribution.status = ContributionStatus.REALIZED
                note_parts = []
                if contribution.note:
                    note_parts.append(contribution.note)
                    
                if price.date > contribution.date:
                    note_parts.append(f"Realized using price from {price.date}")
                else:
                    note_parts.append("Automatically realized")
                    
                contribution.note = " - ".join(note_parts)
                
                # Add allocation to contribution
                contribution.etf_allocations.append(allocation)
                
                total_new_units += units
                realized_contributions.append(contribution)
                
            except HTTPException as e:
                # If we can't get price data at all, skip it
                continue
                
        if realized_contributions:
            # Update pension's total units
            pension.total_units += total_new_units
            
            # Update current value based on latest ETF price
            latest_price = etf_crud.get_latest_price(db, etf_id=pension.etf_id)
            if latest_price:
                pension.current_value = pension.total_units * Decimal(str(latest_price.price))
            
            db.commit()
            
        return realized_contributions

pension_crud = CRUDPension(BasePension)