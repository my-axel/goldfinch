"""
Service for extracting historical time series data from each pension type.

Each method returns a list of HistoricalDataPoint sorted ascending by date,
based on the actual statement records stored in the database.

ETF pensions are handled differently: they have no statement table, so
value history is computed from contribution history × ETF prices via the
existing CRUDPensionETF.get_statistics() logic.
"""
from datetime import date
from decimal import Decimal
from typing import List

from sqlalchemy.orm import Session

from app.models.pension_state import PensionState
from app.models.pension_savings import PensionSavings
from app.models.pension_insurance import PensionInsurance
from app.models.pension_company import PensionCompany
from app.models.pension_etf import PensionETF
from app.schemas.pension_series import HistoricalDataPoint


class PensionHistoricalSeriesService:
    """Extracts historical value series for each pension type."""

    def get_historical_state(self, pension: PensionState) -> List[HistoricalDataPoint]:
        """
        State pension: from PensionStateStatement.current_value.
        Statements are ordered desc by default (model relationship), so we reverse.
        Only includes statements where current_value is not None.
        """
        statements = sorted(
            [s for s in pension.statements if s.current_value is not None],
            key=lambda s: s.statement_date
        )
        return [
            HistoricalDataPoint(
                date=s.statement_date,
                value=Decimal(str(s.current_value)),
                contributions_to_date=None  # State pension has no tracked contributions
            )
            for s in statements
        ]

    def get_historical_savings(self, pension: PensionSavings) -> List[HistoricalDataPoint]:
        """Savings pension: from PensionSavingsStatement.balance."""
        statements = sorted(pension.statements, key=lambda s: s.statement_date)
        return [
            HistoricalDataPoint(
                date=s.statement_date,
                value=Decimal(str(s.balance)),
                contributions_to_date=None
            )
            for s in statements
        ]

    def get_historical_insurance(self, pension: PensionInsurance) -> List[HistoricalDataPoint]:
        """Insurance pension: from PensionInsuranceStatement.value + total_contributions."""
        statements = sorted(pension.statements, key=lambda s: s.statement_date)
        return [
            HistoricalDataPoint(
                date=s.statement_date,
                value=Decimal(str(s.value)),
                contributions_to_date=(
                    Decimal(str(s.total_contributions)) if s.total_contributions is not None else None
                )
            )
            for s in statements
        ]

    def get_historical_company(self, pension: PensionCompany) -> List[HistoricalDataPoint]:
        """Company pension: from PensionCompanyStatement.value."""
        statements = sorted(pension.statements, key=lambda s: s.statement_date)
        return [
            HistoricalDataPoint(
                date=s.statement_date,
                value=Decimal(str(s.value)),
                contributions_to_date=None
            )
            for s in statements
        ]

    def get_historical_etf(
        self,
        pension: PensionETF,
        db: Session,
        etf_crud_instance,
    ) -> List[HistoricalDataPoint]:
        """
        ETF pension: delegates to CRUDPensionETF.get_statistics() which computes
        month-by-month portfolio value from contribution history × ETF price data.

        The value_history returned by get_statistics() is already sorted ascending
        and contains the end-of-month value for each month.
        """
        stats = etf_crud_instance.get_statistics(db=db, pension_id=pension.id)
        result = []
        for point in stats.value_history:
            result.append(
                HistoricalDataPoint(
                    date=date.fromisoformat(point["date"]),
                    value=Decimal(str(point["value"])),
                    contributions_to_date=None
                )
            )
        return result
