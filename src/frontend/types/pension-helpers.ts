/**
 * TODO: Consider moving calculation logic to backend services
 * TODO: Add caching for expensive calculations
 * TODO: Add error handling for API responses
 * TODO: Add performance monitoring for calculations
 */

import { 
  HistoricalContribution, 
  ContributionStep, 
  Pension, 
  PensionType 
} from './pension'

/**
 * Helper type for creating new pensions. Omits system-generated fields
 * like 'id' and 'current_value' which are set during creation.
 * Generic type ensures correct pension subtype is created.
 * 
 * TODO: Add validation schema for API requests
 * TODO: Add validation pipe for request data
 * TODO: Add response serialization
 */
export type NewPension<T extends PensionType> = Omit<
  Extract<Pension, { type: T }>,
  'id' | 'current_value'
>

/**
 * Generates actual contribution records based on the contribution plan.
 * Only generates contributions up to the current date. Will be replaced
 * by backend processing for production use.
 * 
 * TODO: Create scheduled task for contribution processing
 * TODO: Implement contribution to ETF unit conversion
 * TODO: Add timezone support for date calculations
 * TODO: Add transaction support for contributions
 * TODO: Add audit logging for contributions
 * TODO: Add error handling for failed contributions
 * TODO: Add notification system for processed contributions
 */
export function generateActualContributions(
  plan: ContributionStep[],
  existingContributions: HistoricalContribution[] = []
): HistoricalContribution[] {
  // This function should be removed once backend handles contributions
  return []
}

/**
 * Calculates the weighted average purchase price for a specific ETF
 * based on historical contributions. This represents the average price
 * paid per unit across all purchases.
 * 
 * TODO: Move calculation to backend for performance
 * TODO: Add caching for historical calculations
 * TODO: Add support for different currencies
 */
export function calculateAveragePrice(
  etf_id: string,
  historical_contributions: HistoricalContribution[],
): number {
  const etf_purchases = historical_contributions
    .flatMap(contrib => 
      contrib.etf_allocations
        .filter(alloc => alloc.etf_id === etf_id)
        .map(alloc => ({
          units: alloc.units_bought,
          amount: alloc.amount
        }))
    )

  const total_amount = etf_purchases.reduce((sum, p) => sum + p.amount, 0)
  const total_units = etf_purchases.reduce((sum, p) => sum + p.units, 0)

  return total_units > 0 ? total_amount / total_units : 0
}

/** 
 * Formats a pension for display in the UI. Provides a consistent
 * string representation based on pension type.
 */
export function formatPensionSummary(pension: Pension): string {
  switch (pension.type) {
    case PensionType.ETF_PLAN:
      return `ETF Plan: ${pension.current_value.toLocaleString('de-DE')} €`
    case PensionType.INSURANCE:
      return `Insurance: ${pension.provider}`
    case PensionType.COMPANY:
      return `Company: ${pension.employer}`
  }
}

/** 
 * Calculates the planned retirement date based on birthday and 
 * planned retirement age. Used for contribution plan end dates
 * and retirement planning.
 * 
 * TODO: Add retirement date calculation endpoint
 * TODO: Consider regional retirement rules
 * TODO: Add support for pension type specific rules
 * TODO: Add validation for legal retirement constraints
 */
export function calculatePlannedRetirementDate(
  birthday: Date,
  retirementAge: number
): Date {
  const retirementDate = new Date(birthday)
  retirementDate.setFullYear(retirementDate.getFullYear() + retirementAge)
  return retirementDate
}

/** 
 * Backend service implementation TODOs
 * 
 * TODO: Implement ETF data fetching service
 * TODO: Add ETF price caching layer
 * TODO: Create price history aggregation
 * TODO: Implement performance calculations
 * TODO: Add portfolio rebalancing logic
 * TODO: Create tax document reporting
 * TODO: Add dividend processing system
 * TODO: Implement currency conversion
 * TODO: Add market holiday handling
 * TODO: Create financial data backup system
 */