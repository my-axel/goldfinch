from typing import Dict, Any, Union, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.pension_etf import (
    PensionETF,
    PensionETFContributionPlanStep,
    PensionETFContributionHistory
)
from app.models.etf import ETF
from app.schemas.pension_etf import (
    PensionETFCreate,
    PensionETFUpdate,
    ContributionHistoryCreate,
    PensionStatusUpdate,
    PensionStatistics
)
from datetime import date, timedelta
from decimal import Decimal
import bisect
import logging
from app.crud.etf import etf_crud
from app.models.enums import PensionStatus
from fastapi import HTTPException
from sqlalchemy import func

logger = logging.getLogger(__name__)

def needs_value_calculation(pension: PensionETF) -> bool:
    """
    Check if an ETF pension needs its value calculated.
    
    Returns True if:
    - It's an existing investment (implied by having existing_units)
    - Has existing units
    - Has a reference date
    - Current value is 0 (indicating pending calculation)
    """
    return (
        pension.existing_units is not None and
        pension.existing_units > 0 and
        pension.reference_date is not None and
        pension.current_value == 0
    )

class CRUDPensionETF(CRUDBase[PensionETF, PensionETFCreate, PensionETFUpdate]):
    def create(
        self, db: Session, *, obj_in: PensionETFCreate
    ) -> PensionETF:
        try:
            # Start by creating the pension object
            obj_in_data = obj_in.dict(exclude={"contribution_plan_steps", "realize_historical_contributions"})
            db_obj = PensionETF(**obj_in_data)
            
            # Handle existing investment initialization
            if db_obj.existing_units and db_obj.reference_date:
                # Set initial total units
                db_obj.total_units = Decimal(str(db_obj.existing_units))
                
                # Get ETF price at reference date
                price = etf_crud.get_price_for_date(db=db, etf_id=db_obj.etf_id, date=db_obj.reference_date)
                if not price:
                    # Try to get next available price
                    price = etf_crud.get_next_available_price(db=db, etf_id=db_obj.etf_id, after_date=db_obj.reference_date)
                
                if price:
                    # Calculate initial current value
                    db_obj.current_value = db_obj.total_units * price.price
                else:
                    # Use latest price as fallback
                    latest_price = etf_crud.get_latest_price(db=db, etf_id=db_obj.etf_id)
                    if not latest_price:
                        logger.error(f"No price data available for ETF {db_obj.etf_id}")
                        raise ValueError(f"No price data available for ETF {db_obj.etf_id}")
                    db_obj.current_value = db_obj.total_units * latest_price.price
                    price = latest_price

            # Add and flush the pension object to get its ID
            db.add(db_obj)
            db.flush()

            # Now that we have the pension ID, create the contribution history for existing investment
            if db_obj.existing_units and db_obj.reference_date and price:
                contribution = PensionETFContributionHistory(
                    pension_etf_id=db_obj.id,
                    contribution_date=db_obj.reference_date,
                    amount=db_obj.current_value,
                    is_manual=True,
                    note=f"Initial investment (price from {price.date})"
                )
                db.add(contribution)

            # Create contribution plan steps
            for step_data in obj_in.contribution_plan_steps:
                step = PensionETFContributionPlanStep(
                    pension_etf_id=db_obj.id,
                    **step_data.dict()
                )
                db.add(step)

            # Commit all changes
            db.commit()
            db.refresh(db_obj)
            return db_obj
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create ETF pension: {str(e)}")
            raise

    def update(
        self,
        db: Session,
        *,
        db_obj: PensionETF,
        obj_in: Union[PensionETFUpdate, Dict[str, Any]]
    ) -> PensionETF:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        # Handle contribution plan steps separately
        if "contribution_plan_steps" in update_data:
            # Remove old steps
            for step in db_obj.contribution_plan_steps:
                db.delete(step)
            
            # Add new steps
            for step in update_data.pop("contribution_plan_steps"):
                step_data = step.dict() if hasattr(step, 'dict') else step
                db_step = PensionETFContributionPlanStep(
                    **step_data,
                    pension_etf_id=db_obj.id
                )
                db.add(db_step)

        # Update other fields
        return super().update(db=db, db_obj=db_obj, obj_in=update_data)

    def create_contribution_history(
        self,
        db: Session,
        *,
        pension_id: int,
        obj_in: ContributionHistoryCreate
    ) -> PensionETFContributionHistory:
        # Get the pension and its ETF
        pension = db.query(PensionETF).get(pension_id)
        if not pension:
            raise ValueError("Pension not found")

        # Get the ETF price on the contribution date (or nearest available).
        # Using the historical price is critical: investing €1,000 in 2018
        # bought many more units than the same amount would buy today.
        price_at_date = etf_crud.get_price_for_date(
            db=db, etf_id=pension.etf_id, date=obj_in.contribution_date
        )
        if not price_at_date:
            price_at_date = etf_crud.get_next_available_price(
                db=db, etf_id=pension.etf_id, after_date=obj_in.contribution_date
            )
        if not price_at_date:
            raise ValueError(f"No price found for ETF {pension.etf_id} around {obj_in.contribution_date}")

        # Calculate units bought at the historical price
        units = Decimal(str(obj_in.amount)) / Decimal(str(price_at_date.price))

        # Create the contribution history
        db_obj = PensionETFContributionHistory(
            **obj_in.dict(),
            pension_etf_id=pension_id
        )
        db.add(db_obj)

        # Update total units and recompute current_value at latest market price
        pension.total_units += units
        latest_price = etf_crud.get_latest_price(db=db, etf_id=pension.etf_id)
        if latest_price:
            pension.current_value = pension.total_units * latest_price.price

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_status(
        self,
        db: Session,
        *,
        db_obj: PensionETF,
        obj_in: PensionStatusUpdate
    ) -> PensionETF:
        """Update the status of a pension ETF."""
        try:
            # Validate status transition
            if obj_in.status == PensionStatus.PAUSED:
                if not obj_in.paused_at:
                    obj_in.paused_at = date.today()
                if db_obj.status == PensionStatus.PAUSED:
                    raise HTTPException(status_code=400, detail="Pension is already paused")
            elif obj_in.status == PensionStatus.ACTIVE:
                if db_obj.status == PensionStatus.ACTIVE:
                    raise HTTPException(status_code=400, detail="Pension is already active")
                if not obj_in.resume_at and not db_obj.resume_at:
                    obj_in.resume_at = date.today()

            # Update status and related fields
            for field, value in obj_in.dict(exclude_unset=True).items():
                setattr(db_obj, field, value)

            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update pension status: {str(e)}")
            raise

    def _should_skip_contribution(
        self,
        db_obj: PensionETF,
        contribution_date: date
    ) -> bool:
        """Check if a contribution should be skipped based on pension status."""
        if db_obj.status == PensionStatus.ACTIVE:
            return False
        
        if db_obj.status == PensionStatus.PAUSED:
            # Skip if contribution date is after pause date
            if db_obj.paused_at and contribution_date >= db_obj.paused_at:
                # Unless there's a resume date and the contribution is after it
                if db_obj.resume_at and contribution_date >= db_obj.resume_at:
                    return False
                return True
        
        return False

    def realize_historical_contributions(
        self,
        db: Session,
        *,
        pension_id: int
    ) -> None:
        """
        Realize historical contributions for an ETF pension.
        This will:
        1. Calculate contribution dates based on plan steps
        2. Get ETF prices for each contribution date
        3. Create contribution history entries and update total units
        """
        pension = self.get(db=db, id=pension_id)
        if not pension:
            raise ValueError(f"ETF Pension {pension_id} not found")

        today = date.today()
        realized_dates = set(ch.contribution_date for ch in pension.contribution_history)
        logger.info(f"Realizing historical contributions for pension {pension_id}")

        try:
            # Reset totals before processing.
            # Preserve existing_units: those units were already held at reference_date
            # and are NOT generated by the contribution plan steps below.
            pension.total_units = (
                Decimal(str(pension.existing_units))
                if pension.existing_units and pension.existing_units > 0
                else Decimal('0')
            )
            pension.current_value = Decimal('0')

            # Process contribution plan steps
            for step in pension.contribution_plan_steps:
                # Skip future contributions
                if step.start_date > today:
                    continue

                # Calculate contribution dates
                dates = self._calculate_contribution_dates(
                    start_date=step.start_date,
                    end_date=min(step.end_date or today, today),
                    frequency=step.frequency
                )

                # Create contribution history for each date
                for contribution_date in dates:
                    # Skip if already realized or should be skipped due to status
                    if contribution_date in realized_dates or self._should_skip_contribution(pension, contribution_date):
                        continue

                    # Get ETF price for the date or next available
                    price = etf_crud.get_price_for_date(
                        db=db,
                        etf_id=pension.etf_id,
                        date=contribution_date
                    )
                    
                    if not price:
                        # Try to get next available price (e.g., next trading day)
                        price = etf_crud.get_next_available_price(
                            db=db,
                            etf_id=pension.etf_id,
                            after_date=contribution_date
                        )
                        
                        if not price:
                            logger.warning(f"No price found for ETF {pension.etf_id} on or after {contribution_date}")
                            continue

                    # Calculate units based on contribution amount and price
                    units = Decimal(str(step.amount)) / Decimal(str(price.price))
                    
                    # Create contribution history entry
                    history = PensionETFContributionHistory(
                        pension_etf_id=pension_id,
                        contribution_date=contribution_date,
                        amount=step.amount,
                        is_manual=False,
                        note=f"Using ETF price from {price.date}" if price.date != contribution_date else None
                    )
                    db.add(history)

                    # Update pension total units
                    pension.total_units += units

            # After all contributions are processed, get the latest price to calculate current value
            latest_price = etf_crud.get_latest_price(db=db, etf_id=pension.etf_id)
            if latest_price:
                pension.current_value = pension.total_units * latest_price.price
            else:
                logger.warning(f"No latest price found for ETF {pension.etf_id}")

            db.commit()
            logger.info(f"Successfully realized historical contributions for pension {pension_id}")

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to realize historical contributions: {str(e)}")
            raise

    def add_due_contributions(
        self,
        db: Session,
        *,
        pension_id: int
    ) -> int:
        """
        Incrementally add newly due contribution entries for a pension.

        Unlike realize_historical_contributions (which resets and rebuilds everything),
        this method ONLY adds entries for dates that have become due since the last run.
        It never resets total_units, so manual one-time investments are preserved.

        Returns the number of new entries added.
        """
        pension = self.get(db=db, id=pension_id)
        if not pension:
            raise ValueError(f"ETF Pension {pension_id} not found")

        if not pension.contribution_plan_steps:
            return 0

        today = date.today()
        realized_dates = set(ch.contribution_date for ch in pension.contribution_history)
        new_count = 0

        try:
            for step in pension.contribution_plan_steps:
                if step.start_date > today:
                    continue

                dates = self._calculate_contribution_dates(
                    start_date=step.start_date,
                    end_date=min(step.end_date or today, today),
                    frequency=step.frequency
                )

                for contribution_date in dates:
                    if contribution_date in realized_dates:
                        continue
                    if self._should_skip_contribution(pension, contribution_date):
                        continue

                    price = etf_crud.get_price_for_date(
                        db=db, etf_id=pension.etf_id, date=contribution_date
                    )
                    if not price:
                        price = etf_crud.get_next_available_price(
                            db=db, etf_id=pension.etf_id, after_date=contribution_date
                        )
                    if not price:
                        logger.warning(f"No price for ETF {pension.etf_id} on or after {contribution_date}, skipping")
                        continue

                    units = Decimal(str(step.amount)) / Decimal(str(price.price))
                    db.add(PensionETFContributionHistory(
                        pension_etf_id=pension_id,
                        contribution_date=contribution_date,
                        amount=step.amount,
                        is_manual=False,
                        note=f"Using ETF price from {price.date}" if price.date != contribution_date else None
                    ))
                    pension.total_units += units
                    realized_dates.add(contribution_date)
                    new_count += 1

            if new_count > 0:
                latest_price = etf_crud.get_latest_price(db=db, etf_id=pension.etf_id)
                if latest_price:
                    pension.current_value = pension.total_units * latest_price.price
                db.commit()
                logger.info(f"Added {new_count} new contributions for pension {pension_id}")

            return new_count

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to add due contributions for pension {pension_id}: {str(e)}")
            raise

    def _calculate_contribution_dates(
        self,
        *,
        start_date: date,
        end_date: date,
        frequency: str
    ) -> List[date]:
        """Calculate contribution dates based on frequency."""
        dates = []
        current_date = start_date

        while current_date <= end_date:
            dates.append(current_date)
            
            if frequency == "MONTHLY":
                if current_date.month == 12:
                    current_date = date(current_date.year + 1, 1, current_date.day)
                else:
                    current_date = date(current_date.year, current_date.month + 1, current_date.day)
            elif frequency == "QUARTERLY":
                if current_date.month >= 10:
                    current_date = date(current_date.year + 1, (current_date.month + 3) % 12 or 12, current_date.day)
                else:
                    current_date = date(current_date.year, current_date.month + 3, current_date.day)
            elif frequency == "SEMI_ANNUALLY":
                if current_date.month > 6:
                    current_date = date(current_date.year + 1, (current_date.month + 6) % 12 or 12, current_date.day)
                else:
                    current_date = date(current_date.year, current_date.month + 6, current_date.day)
            elif frequency == "ANNUALLY":
                current_date = date(current_date.year + 1, current_date.month, current_date.day)
            elif frequency == "ONE_TIME":
                break
            else:
                logger.warning(f"Unknown frequency: {frequency}")
                break

        return dates

    @staticmethod
    def _compute_xirr(cashflows: list[tuple], guess: float = 0.1) -> float | None:
        """
        Compute XIRR (Extended Internal Rate of Return) via Newton-Raphson.

        cashflows: list of (date, float) — negative amounts are outflows (investments),
                   positive amounts are inflows (e.g. current portfolio value).
        Returns annualised rate as a decimal (0.10 = 10 %), or None if it doesn't converge.
        """
        if not cashflows or len(cashflows) < 2:
            return None

        base = cashflows[0][0]
        years = [(c[0] - base).days / 365.0 for c in cashflows]
        amounts = [float(c[1]) for c in cashflows]

        rate = guess
        for _ in range(1000):
            if rate <= -1:
                return None
            try:
                f = sum(a / (1 + rate) ** y for a, y in zip(amounts, years))
                df = sum(-y * a / (1 + rate) ** (y + 1) for a, y in zip(amounts, years))
            except (ZeroDivisionError, OverflowError):
                return None
            if abs(df) < 1e-12:
                break
            new_rate = rate - f / df
            if abs(new_rate - rate) < 1e-8:
                return new_rate if -0.99 < new_rate < 100 else None
            rate = new_rate
        return None

    def get_statistics(
        self,
        db: Session,
        *,
        pension_id: int
    ) -> PensionStatistics:
        """Calculate statistics for an ETF pension."""
        try:
            # Get the pension with all its relationships
            pension = db.query(PensionETF).get(pension_id)
            if not pension:
                raise HTTPException(status_code=404, detail="ETF Pension not found")

            # Calculate total invested amount from contribution history
            total_invested = db.query(func.sum(PensionETFContributionHistory.amount))\
                .filter(PensionETFContributionHistory.pension_etf_id == pension_id)\
                .scalar() or Decimal('0')

            # current_value and annual_return are computed after value_history
            # so we can use the same running_units that drive the chart.
            current_value = pension.current_value  # interim; replaced below if possible
            annual_return = None

            # Build monthly portfolio value history using actual ETF price data.
            # Algorithm:
            #   1. Fetch all ETF prices between first contribution and today in one query.
            #   2. For each contribution, compute units bought (amount / price on that date).
            #   3. Walk month by month; for each month use the last available price to value
            #      the accumulated units → gives a smooth growth curve.
            #   4. Append a final point for today using pension.current_value so the chart
            #      end always matches the sidebar "current value".
            value_history = []
            today = date.today()
            if not pension.contribution_history and pension.existing_units and pension.existing_units > 0:
                # Existing-only ETF: no historical reconstruction — chart starts from today.
                # The invested_amount field (if set) provides the cost basis for statistics.
                if pension.current_value > 0:
                    value_history = [{"date": today.isoformat(), "value": str(pension.current_value)}]
                if pension.invested_amount:
                    total_invested = Decimal(str(pension.invested_amount))
                total_return = current_value - total_invested
                return PensionStatistics(
                    total_invested_amount=total_invested,
                    current_value=current_value,
                    total_return=total_return,
                    annual_return=None,
                    contribution_history=[],
                    value_history=value_history
                )
            elif pension.contribution_history:
                sorted_contributions = sorted(
                    pension.contribution_history, key=lambda x: x.contribution_date
                )
                first_date = sorted_contributions[0].contribution_date

                # --- Fetch all prices in one DB round-trip ---
                all_prices = etf_crud.get_prices_between_dates(
                    db, pension.etf_id, first_date, today
                )
                # Build sorted lists for fast "price on or before date" lookup
                price_dates: list[date] = [p.date for p in all_prices]
                price_values: list[Decimal] = [Decimal(str(p.price)) for p in all_prices]
                # price_dates is already sorted ascending (get_prices_between_dates uses asc)

                def price_on_or_before(target: date) -> Decimal | None:
                    """Return the last known ETF price on or before *target*."""
                    idx = bisect.bisect_right(price_dates, target) - 1
                    return price_values[idx] if idx >= 0 else None

                # --- Pre-compute units per contribution ---
                contribution_events: list[tuple[date, Decimal]] = []
                for ch in sorted_contributions:
                    p = price_on_or_before(ch.contribution_date)
                    if not p or p == 0:
                        # No price at or before this date (e.g. ETF launched after reference_date).
                        # Fall back to the first available price after the contribution date —
                        # this is consistent with how create() and create_contribution_history()
                        # compute the stored amount (amount = units × nearest_available_price).
                        idx = bisect.bisect_left(price_dates, ch.contribution_date)
                        p = price_values[idx] if idx < len(price_values) else None
                    if p and p > 0:
                        units = Decimal(str(ch.amount)) / p
                        contribution_events.append((ch.contribution_date, units))

                # --- Walk month by month ---
                running_units = Decimal('0')
                event_idx = 0
                cur = date(first_date.year, first_date.month, 1)
                end_month = date(today.year, today.month, 1)

                while cur <= end_month:
                    y, m = cur.year, cur.month
                    # First day of next month
                    if m == 12:
                        next_month = date(y + 1, 1, 1)
                    else:
                        next_month = date(y, m + 1, 1)
                    month_end = next_month - timedelta(days=1)

                    # Accumulate contributions that fall within this month
                    while event_idx < len(contribution_events):
                        ev_date, ev_units = contribution_events[event_idx]
                        if ev_date < next_month:
                            running_units += ev_units
                            event_idx += 1
                        else:
                            break

                    if running_units > 0:
                        p = price_on_or_before(month_end)
                        if p:
                            value_history.append({
                                "date": month_end.isoformat(),
                                "value": str(running_units * p)
                            })

                    cur = next_month

                # --- Add a "today" data point using the computed running_units ---
                # We deliberately do NOT use pension.current_value here, because
                # total_units in the DB can diverge from contribution_history
                # (e.g. due to historical bugs or data inconsistencies). Using
                # running_units keeps the chart end consistent with every other
                # data point in value_history.
                if running_units > 0:
                    latest_p = price_on_or_before(today)
                    if latest_p:
                        today_str = today.isoformat()
                        computed_today = running_units * latest_p
                        if value_history and value_history[-1]["date"][:7] == today_str[:7]:
                            value_history[-1] = {"date": today_str, "value": str(computed_today)}
                        else:
                            value_history.append({"date": today_str, "value": str(computed_today)})

                        # Use the consistently-computed value for all derived stats.
                        # This avoids discrepancies caused by pension.total_units being
                        # out of sync with contribution_history (e.g. after realize bugs).
                        current_value = computed_today

                        # XIRR: cash outflows = each contribution (negative),
                        #        cash inflow  = current portfolio value (positive, today).
                        if total_invested > 0 and len(sorted_contributions) >= 1:
                            xirr_flows: list[tuple] = [
                                (ch.contribution_date, -float(ch.amount))
                                for ch in sorted_contributions
                            ]
                            xirr_flows.append((today, float(computed_today)))
                            days_invested = (today - sorted_contributions[0].contribution_date).days
                            if days_invested >= 30:
                                try:
                                    rate = self._compute_xirr(xirr_flows)
                                    if rate is not None:
                                        annual_return = round(Decimal(str(rate * 100)), 2)
                                except Exception:
                                    annual_return = None

            total_return = current_value - total_invested

            return PensionStatistics(
                total_invested_amount=total_invested,
                current_value=current_value,
                total_return=total_return,
                annual_return=annual_return,
                contribution_history=pension.contribution_history,
                value_history=value_history
            )

        except Exception as e:
            logger.error(f"Failed to calculate pension statistics: {str(e)}")
            raise

    def get_list(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        member_id: int = None
    ) -> List[dict]:
        """
        Get a lightweight list of ETF pensions with ETF names.
        This optimized query avoids loading full ETF details and contribution data.
        """
        from datetime import date
        today = date.today()
        
        # First, get the basic pension information with ETF names
        query = db.query(
            PensionETF.id,
            PensionETF.name,
            PensionETF.member_id,
            PensionETF.current_value,
            PensionETF.total_units,
            PensionETF.etf_id,
            ETF.name.label("etf_name"),
            PensionETF.status,
            PensionETF.paused_at,
            PensionETF.resume_at,
            PensionETF.existing_units,
            PensionETF.reference_date
        ).join(ETF, PensionETF.etf_id == ETF.id)
        
        if member_id is not None:
            query = query.filter(PensionETF.member_id == member_id)
        
        result = query.offset(skip).limit(limit).all()
        
        # Get all pension IDs from the result
        pension_ids = [row.id for row in result]
        
        # If no pensions found, return empty list
        if not pension_ids:
            return []
        
        # Get current contribution steps for all pensions in one query
        current_steps_query = db.query(
            PensionETFContributionPlanStep.pension_etf_id,
            PensionETFContributionPlanStep.amount,
            PensionETFContributionPlanStep.frequency
        ).filter(
            PensionETFContributionPlanStep.pension_etf_id.in_(pension_ids),
            PensionETFContributionPlanStep.start_date <= today,
            (PensionETFContributionPlanStep.end_date >= today) | (PensionETFContributionPlanStep.end_date.is_(None))
        )
        
        # Create a dictionary mapping pension_id to current step
        current_steps = {}
        for step in current_steps_query:
            current_steps[step.pension_etf_id] = {
                "amount": step.amount,
                "frequency": step.frequency
            }
        
        # Convert SQLAlchemy Row objects to dictionaries with current step information
        return [
            {
                "id": row.id,
                "name": row.name,
                "member_id": row.member_id,
                "current_value": row.current_value,
                "total_units": row.total_units,
                "etf_id": row.etf_id,
                "etf_name": row.etf_name,
                "status": row.status,
                "paused_at": row.paused_at,
                "resume_at": row.resume_at,
                "is_existing_investment": row.existing_units is not None and row.existing_units > 0 and row.reference_date is not None,
                "existing_units": row.existing_units,
                "current_step_amount": current_steps.get(row.id, {}).get("amount"),
                "current_step_frequency": current_steps.get(row.id, {}).get("frequency")
            }
            for row in result
        ]

    def create_with_zero_value(self, db: Session, *, obj_in: PensionETFCreate) -> PensionETF:
        """
        Create an ETF pension with zero current value for async calculation.
        This is used when price data is not immediately available.
        """
        try:
            # Start by creating the pension object
            obj_in_data = obj_in.dict(exclude={"contribution_plan_steps", "realize_historical_contributions"})
            db_obj = PensionETF(**obj_in_data)
            
            # Set initial values for async calculation
            if db_obj.existing_units and db_obj.reference_date:
                # Set initial total units
                db_obj.total_units = Decimal(str(db_obj.existing_units))
                # Set current value to 0 for pending calculation
                db_obj.current_value = 0
            
            # Add and flush the pension object to get its ID
            db.add(db_obj)
            db.flush()
            
            # Create contribution plan steps
            for step_data in obj_in.contribution_plan_steps:
                step = PensionETFContributionPlanStep(
                    pension_etf_id=db_obj.id,
                    **step_data.dict()
                )
                db.add(step)
            
            db.commit()
            db.refresh(db_obj)
            logger.info(f"Created ETF pension with ID {db_obj.id} with zero value for async calculation")
            return db_obj
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating ETF pension with zero value: {str(e)}")
            raise

pension_etf = CRUDPensionETF(PensionETF) 