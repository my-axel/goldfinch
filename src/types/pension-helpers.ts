/**
 * TODO: Consider moving calculation logic to backend services
 * TODO: Add caching for expensive calculations
 * TODO: Add error handling for API responses
 * TODO: Add performance monitoring for calculations
 */

import { ETFDailyPrice } from './etf'
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
 * TODO: Add backend validation pipe type
 */
export type NewPension<T extends PensionType> = Omit<
  Extract<Pension, { type: T }>,
  'id' | 'current_value'
>

/**
 * Generates actual contribution records based on the contribution plan.
 * Only generates contributions up to the current date and preserves any
 * manual overrides that exist in the historical record.
 * 
 * TODO: Move to backend service for consistent date handling
 * TODO: Add timezone support
 * TODO: Add transaction support for bulk updates
 * TODO: Add audit logging for generated contributions
 * 
 * @param plan - Array of planned contribution steps
 * @param existingContributions - Already recorded contributions to preserve
 * @returns Array of contributions including both generated and existing ones
 */
export function generateActualContributions(
  plan: ContributionStep[],
  existingContributions: HistoricalContribution[] = []
): HistoricalContribution[] {
  const today = new Date()
  const contributions: HistoricalContribution[] = [...existingContributions]
  
  plan.forEach(step => {
    let currentDate = new Date(step.start_date)
    const endDate = step.end_date ? new Date(step.end_date) : today
    
    while (currentDate <= endDate && currentDate <= today) {
      // Check if we already have a manual contribution for this date
      const existingContribution = contributions.find(
        c => c.date.getTime() === currentDate.getTime()
      )
      
      if (!existingContribution) {
        contributions.push({
          date: new Date(currentDate),
          amount: step.amount,
          planned_amount: step.amount,
          is_manual_override: false,
          etf_allocations: []  // To be filled based on target allocation
        })
      }
      
      // Move to next contribution date based on frequency
      switch (step.frequency) {
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
        case 'QUARTERLY':
          currentDate.setMonth(currentDate.getMonth() + 3)
          break
        case 'SEMI_ANNUALLY':
          currentDate.setMonth(currentDate.getMonth() + 6)
          break
        case 'ANNUALLY':
          currentDate.setFullYear(currentDate.getFullYear() + 1)
          break
        case 'ONE_TIME':
          currentDate = new Date(endDate)
          break
      }
    }
  })
  
  return contributions.sort((a, b) => a.date.getTime() - b.date.getTime())
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