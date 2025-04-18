from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional
from pydantic import BaseModel

from app.models.pension_state import PensionState, PensionStateStatement
from app.models.settings import Settings
from app.models.household import HouseholdMember

class StatePensionScenario(BaseModel):
    """Projection scenario for state pension."""
    monthly_amount: Optional[Decimal]
    annual_amount: Optional[Decimal]
    retirement_age: int
    years_to_retirement: int
    growth_rate: Decimal

class StatePensionProjection(BaseModel):
    """Complete projection including both retirement dates."""
    planned: Dict[str, StatePensionScenario]
    possible: Dict[str, StatePensionScenario]

class PensionStateProjectionService:
    def calculate_scenarios(
        self,
        pension: PensionState,
        member: HouseholdMember,
        settings: Settings,
        reference_date: date = None
    ) -> StatePensionProjection:
        """
        Calculate projection scenarios for state pension based on:
        - Latest statement values
        - Member's planned and possible retirement ages
        - Configured growth rates from settings
        
        Returns scenarios for both planned and possible retirement dates,
        each containing pessimistic, realistic, and optimistic projections.
        
        If no statements are available, returns an empty projection structure
        with empty dictionaries for both planned and possible scenarios.
        """
        if not pension.statements:
            # Return empty projection structure when no statements are available
            return StatePensionProjection(
                planned={},
                possible={}
            )
            
        latest_statement = pension.statements[0]  # Already ordered by desc(statement_date)
        reference_date = reference_date or date.today()
        
        # If no projected amount in latest statement, we can't calculate scenarios
        if latest_statement.projected_monthly_amount is None:
            return StatePensionProjection(
                planned={},
                possible={}
            )
        
        # Calculate scenarios for both retirement dates
        planned_scenarios = self._calculate_retirement_scenarios(
            statement=latest_statement,
            retirement_date=member.retirement_date_planned,
            retirement_age=member.retirement_age_planned,
            settings=settings,
            reference_date=reference_date
        )
        
        possible_scenarios = self._calculate_retirement_scenarios(
            statement=latest_statement,
            retirement_date=member.retirement_date_possible,
            retirement_age=member.retirement_age_possible,
            settings=settings,
            reference_date=reference_date
        )
        
        return StatePensionProjection(
            planned=planned_scenarios,
            possible=possible_scenarios
        )
    
    def _calculate_retirement_scenarios(
        self,
        statement: PensionStateStatement,
        retirement_date: date,
        retirement_age: int,
        settings: Settings,
        reference_date: date
    ) -> Dict[str, StatePensionScenario]:
        """Calculate scenarios for a specific retirement date."""
        # Calculate years until retirement
        years_to_retirement = max(
            0,
            (retirement_date.year - reference_date.year) +
            (retirement_date.month - reference_date.month) / 12
        )
        
        # Convert to Decimal for calculations
        years_to_retirement_decimal = Decimal(str(years_to_retirement))
        
        scenarios = {}
        
        # Default growth rates in case settings is None
        default_rates = {
            "pessimistic": Decimal("1.0"),
            "realistic": Decimal("1.5"),
            "optimistic": Decimal("2.0")
        }
        
        # Calculate for each scenario type
        for scenario in ['pessimistic', 'realistic', 'optimistic']:
            # Get rate from settings or use default
            if settings is not None and hasattr(settings, f'state_pension_{scenario}_rate'):
                rate = getattr(settings, f'state_pension_{scenario}_rate')
            else:
                rate = default_rates[scenario]
            
            # Calculate projected monthly amount with compound interest
            projected_amount = statement.projected_monthly_amount * (
                (Decimal("1") + rate / Decimal("100")) ** years_to_retirement_decimal
            )
            
            scenarios[scenario] = StatePensionScenario(
                monthly_amount=projected_amount.quantize(Decimal('0.01')),
                annual_amount=(projected_amount * Decimal("12")).quantize(Decimal('0.01')),
                retirement_age=retirement_age,
                years_to_retirement=int(years_to_retirement),
                growth_rate=rate
            )
            
        return scenarios 