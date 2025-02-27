import { useMemo } from 'react'
import { ProjectionDataPoint } from '@/frontend/types/projection'
import { ContributionStep, ContributionHistoryResponse } from '@/frontend/types/pension'
import { calculateCombinedScenarios } from '@/frontend/lib/projection-utils'
import { useSettings } from "@/frontend/context/SettingsContext"

/**
 * Input parameters for the useProjectionScenarios hook
 * @interface ProjectionScenariosInput
 * @property {ProjectionDataPoint[]} historicalData - Array of historical data points with dates and values
 * @property {ContributionStep[]} contributionSteps - Array of planned contribution steps
 * @property {Date} retirementDate - Target retirement date for projections
 * @property {ContributionHistoryResponse[]} historicalContributions - Array of historical contributions
 */
interface ProjectionScenariosInput {
  historicalData: ProjectionDataPoint[]
  contributionSteps: ContributionStep[]
  retirementDate: Date
  historicalContributions: ContributionHistoryResponse[]
}

/**
 * A React hook that manages projection scenario calculations for retirement planning.
 * 
 * This hook provides a simplified interface for calculating and managing multiple projection scenarios
 * (pessimistic, realistic, and optimistic) based on historical data and future contributions.
 * It uses memoization to optimize performance and prevent unnecessary recalculations.
 * 
 * Key features:
 * - Synchronous calculations using useMemo for better performance
 * - Automatic rate management from global settings
 * - Error handling with try-catch
 * - Stable calculation inputs to prevent unnecessary recalculations
 * 
 * @example
 * ```tsx
 * const { scenarios } = useProjectionScenarios({
 *   historicalData: [...],
 *   contributionSteps: [...],
 *   retirementDate: new Date('2050-01-01'),
 *   historicalContributions: [...]
 * });
 * 
 * // Access scenario data
 * const finalValue = scenarios?.realistic.finalValue;
 * const monthlyData = scenarios?.realistic.dataPoints;
 * ```
 * 
 * @param {ProjectionScenariosInput} props - Input parameters for scenario calculations
 * @returns {{ scenarios: CombinedScenariosOutput | null }} Object containing calculated scenarios or null if calculation fails
 */
export function useProjectionScenarios({
  historicalData,
  contributionSteps,
  retirementDate,
  historicalContributions
}: ProjectionScenariosInput) {
  const { settings: globalSettings } = useSettings()

  /**
   * Extracts the last historical value for use as the starting point in projections.
   * Returns 0 if no historical data is available.
   */
  const lastHistoricalValue = useMemo(() => {
    if (historicalData.length === 0) return 0
    return historicalData[historicalData.length - 1].value
  }, [historicalData])

  /**
   * Creates a stable start date that won't change during component lifecycle.
   * This prevents unnecessary recalculations due to date changes.
   */
  const startDate = useMemo(() => new Date(), [])

  /**
   * Memoizes calculation inputs to prevent unnecessary recalculations.
   * Only updates when relevant inputs change.
   */
  const calculationInputs = useMemo(() => ({
    initialValue: lastHistoricalValue,
    contributionSteps,
    rates: {
      pessimistic: globalSettings.projection_pessimistic_rate,
      realistic: globalSettings.projection_realistic_rate,
      optimistic: globalSettings.projection_optimistic_rate
    },
    startDate,
    endDate: retirementDate,
    historicalContributions
  }), [
    lastHistoricalValue,
    contributionSteps,
    globalSettings.projection_pessimistic_rate,
    globalSettings.projection_realistic_rate,
    globalSettings.projection_optimistic_rate,
    retirementDate,
    historicalContributions,
    startDate
  ])

  /**
   * Calculates all scenarios synchronously using memoization.
   * Returns null if calculation fails.
   */
  const scenarios = useMemo(() => {
    try {
      return calculateCombinedScenarios(calculationInputs)
    } catch (err) {
      console.error('Scenario calculation error:', err);
      return null
    }
  }, [calculationInputs])

  return { scenarios }
} 