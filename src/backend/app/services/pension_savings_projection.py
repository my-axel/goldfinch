from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, List, Tuple

from app.models.pension_savings import PensionSavings, PensionSavingsStatement, PensionSavingsContributionPlanStep
from app.models.household import HouseholdMember
from app.models.enums import ContributionFrequency, CompoundingFrequency
from app.schemas.pension_savings import PensionSavingsProjection, PensionSavingsScenario

class PensionSavingsProjectionService:
    """Service for calculating projections for savings pensions."""
    
    def calculate_scenarios(
        self,
        pension: PensionSavings,
        member: HouseholdMember,
        reference_date: date = None
    ) -> PensionSavingsProjection:
        """
        Calculate projection scenarios for savings pension based on:
        - Latest statement balance
        - Interest rates (pessimistic, realistic, optimistic)
        - Compounding frequency
        - Contribution plan steps
        - Member's planned and possible retirement dates
        
        Returns scenarios for both planned and possible retirement dates,
        each containing pessimistic, realistic, and optimistic projections.
        
        If no statements are available, returns an empty projection structure.
        """
        # Check if we have any valid statements
        valid_statements = [s for s in pension.statements if not s._sa_instance_state.deleted]
        if not valid_statements:
            # Return empty projection structure when no statements are available
            return PensionSavingsProjection(
                planned={},
                possible={}
            )
            
        # Use the latest statement as the starting point
        latest_statement = valid_statements[0]  # Already ordered by desc(statement_date)
        reference_date = reference_date or date.today()
        
        # Calculate scenarios for both retirement dates
        planned_scenarios = self._calculate_retirement_scenarios(
            pension=pension,
            statement=latest_statement,
            retirement_date=member.retirement_date_planned,
            retirement_age=member.retirement_age_planned,
            reference_date=reference_date
        )
        
        possible_scenarios = self._calculate_retirement_scenarios(
            pension=pension,
            statement=latest_statement,
            retirement_date=member.retirement_date_possible,
            retirement_age=member.retirement_age_possible,
            reference_date=reference_date
        )
        
        return PensionSavingsProjection(
            planned=planned_scenarios,
            possible=possible_scenarios
        )
    
    def _calculate_retirement_scenarios(
        self,
        pension: PensionSavings,
        statement: PensionSavingsStatement,
        retirement_date: date,
        retirement_age: int,
        reference_date: date
    ) -> Dict[str, PensionSavingsScenario]:
        """Calculate scenarios for a specific retirement date."""
        # Calculate years until retirement
        years_to_retirement = max(
            0,
            (retirement_date.year - reference_date.year) +
            (retirement_date.month - reference_date.month) / 12
        )
        
        # Get the starting balance
        starting_balance = statement.balance
        
        # Define the scenario types with their corresponding rates
        scenarios = {
            "pessimistic": pension.pessimistic_rate,
            "realistic": pension.realistic_rate,
            "optimistic": pension.optimistic_rate
        }
        
        result = {}
        
        for scenario_name, rate in scenarios.items():
            # Calculate projected balance for this scenario
            projected_balance, total_contributions = self._calculate_projected_balance(
                starting_balance=starting_balance,
                annual_rate=rate,
                years=Decimal(str(years_to_retirement)),
                compounding_frequency=pension.compounding_frequency,
                contribution_steps=pension.contribution_plan_steps,
                reference_date=reference_date,
                end_date=retirement_date
            )
            
            # Calculate what the balance would be without contributions
            balance_without_contributions = self._calculate_compound_interest(
                starting_balance=starting_balance,
                annual_rate=rate,
                years=Decimal(str(years_to_retirement)),
                compounding_frequency=pension.compounding_frequency
            )
            
            result[scenario_name] = PensionSavingsScenario(
                balance=projected_balance.quantize(Decimal('0.01')),
                retirement_age=retirement_age,
                years_to_retirement=int(years_to_retirement),
                growth_rate=rate,
                total_contributions=total_contributions.quantize(Decimal('0.01')),
                balance_without_contributions=balance_without_contributions.quantize(Decimal('0.01'))
            )
            
        return result
    
    def _calculate_projected_balance(
        self,
        starting_balance: Decimal,
        annual_rate: Decimal,
        years: Decimal,
        compounding_frequency: CompoundingFrequency,
        contribution_steps: List[PensionSavingsContributionPlanStep],
        reference_date: date,
        end_date: date
    ) -> Tuple[Decimal, Decimal]:
        """
        Calculate the projected balance with compound interest and contributions.
        
        Args:
            starting_balance: Initial balance from statement
            annual_rate: Interest rate as a percentage (e.g., 5.0 for 5%)
            years: Years until retirement
            compounding_frequency: How often interest is compounded
            contribution_steps: List of contribution plan steps
            reference_date: Starting date for calculation
            end_date: End date (retirement date) for calculation
            
        Returns:
            Tuple of (projected_balance, total_contributions)
        """
        if years <= 0 or not contribution_steps:
            # Just calculate compound interest if no years or no contributions
            balance = self._calculate_compound_interest(
                starting_balance=starting_balance,
                annual_rate=annual_rate,
                years=years,
                compounding_frequency=compounding_frequency
            )
            return balance, Decimal("0.00")
        
        # Convert annual rate to decimal form
        rate_decimal = annual_rate / Decimal("100")
        
        # Get compounding periods per year
        periods_per_year = self._get_compounding_periods(compounding_frequency)
        
        # Calculate rate per period
        rate_per_period = rate_decimal / periods_per_year
        
        # Initialize variables for simulation
        balance = starting_balance
        total_periods = int(years * periods_per_year)
        
        # Get period length in days
        days_per_period = 365 / periods_per_year
        
        current_date = reference_date
        total_contributions = Decimal("0.00")
        
        # Simulate each period
        for period in range(total_periods):
            # Calculate contributions for this period
            period_contributions = self._calculate_period_contributions(
                contribution_steps=contribution_steps,
                current_date=current_date,
                days_per_period=days_per_period,
                end_date=end_date
            )
            
            # Add contributions to the balance
            balance += period_contributions
            total_contributions += period_contributions
            
            # Apply compound interest for this period
            balance *= (Decimal("1") + rate_per_period)
            
            # Advance the date
            current_date += timedelta(days=int(days_per_period))
            
            # Stop if we've reached the end date
            if current_date > end_date:
                break
                
        return balance, total_contributions
    
    def _calculate_compound_interest(
        self,
        starting_balance: Decimal,
        annual_rate: Decimal,
        years: Decimal,
        compounding_frequency: CompoundingFrequency
    ) -> Decimal:
        """
        Calculate compound interest without contributions.
        
        Formula: P * (1 + r/n)^(n*t)
        Where:
        - P is principal (starting balance)
        - r is annual rate (as decimal)
        - n is number of compounding periods per year
        - t is time in years
        """
        if years <= 0:
            return starting_balance
            
        # Convert annual rate to decimal form
        rate_decimal = annual_rate / Decimal("100")
        
        # Get compounding periods per year
        periods_per_year = self._get_compounding_periods(compounding_frequency)
        
        # Calculate compound interest
        return starting_balance * (
            (Decimal("1") + rate_decimal / periods_per_year) ** (periods_per_year * years)
        )
    
    def _get_compounding_periods(self, frequency: CompoundingFrequency) -> Decimal:
        """Get the number of compounding periods per year based on frequency."""
        if frequency == CompoundingFrequency.DAILY:
            return Decimal("365")
        elif frequency == CompoundingFrequency.MONTHLY:
            return Decimal("12")
        elif frequency == CompoundingFrequency.QUARTERLY:
            return Decimal("4")
        elif frequency == CompoundingFrequency.ANNUALLY:
            return Decimal("1")
        else:
            # Default to annual compounding
            return Decimal("1")
    
    def _calculate_period_contributions(
        self,
        contribution_steps: List[PensionSavingsContributionPlanStep],
        current_date: date,
        days_per_period: Decimal,
        end_date: date
    ) -> Decimal:
        """
        Calculate the contributions for a single compounding period.
        
        Args:
            contribution_steps: List of contribution plan steps
            current_date: Starting date of the period
            days_per_period: Length of the period in days
            end_date: Maximum end date (retirement date)
            
        Returns:
            Total contributions for this period
        """
        total_contributions = Decimal("0.00")
        
        # End date of this period
        period_end = current_date + timedelta(days=int(days_per_period))
        if period_end > end_date:
            period_end = end_date
            
        # Check each contribution step
        for step in contribution_steps:
            # Skip if step hasn't started yet
            if step.start_date > period_end:
                continue
                
            # Skip if step has already ended
            if step.end_date is not None and step.end_date < current_date:
                continue
                
            # Calculate how many contributions fall within this period
            contributions = self._get_contributions_in_period(
                frequency=step.frequency,
                amount=step.amount,
                start_date=max(step.start_date, current_date),
                end_date=min(step.end_date or end_date, period_end)
            )
            
            total_contributions += contributions
            
        return total_contributions
    
    def _get_contributions_in_period(
        self,
        frequency: ContributionFrequency,
        amount: Decimal,
        start_date: date,
        end_date: date
    ) -> Decimal:
        """
        Calculate the total contributions between two dates based on frequency.
        
        Args:
            frequency: How often contributions are made
            amount: Amount per contribution
            start_date: Start date of the period
            end_date: End date of the period
            
        Returns:
            Total contributions for this period
        """
        # Handle one-time contributions
        if frequency == ContributionFrequency.ONE_TIME:
            # If the start date is within the period, count it once
            if start_date <= end_date:
                return amount
            return Decimal("0.00")
            
        # Calculate days in the period
        days = (end_date - start_date).days + 1
        if days <= 0:
            return Decimal("0.00")
            
        # Calculate contributions based on frequency
        if frequency == ContributionFrequency.MONTHLY:
            # Approximate months in the period
            months = days / 30
            return amount * Decimal(str(months))
            
        elif frequency == ContributionFrequency.QUARTERLY:
            # Approximate quarters in the period
            quarters = days / 90
            return amount * Decimal(str(quarters))
            
        elif frequency == ContributionFrequency.SEMI_ANNUALLY:
            # Approximate half-years in the period
            half_years = days / 182
            return amount * Decimal(str(half_years))
            
        elif frequency == ContributionFrequency.ANNUALLY:
            # Approximate years in the period
            years = days / 365
            return amount * Decimal(str(years))
            
        # Default fallback
        return Decimal("0.00") 