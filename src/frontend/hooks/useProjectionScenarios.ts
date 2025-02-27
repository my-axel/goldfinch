import { useState, useMemo, useCallback } from 'react'
import { ProjectionDataPoint } from '@/frontend/types/projection'
import { ContributionStep, ContributionHistoryResponse } from '@/frontend/types/pension'
import { calculateCombinedScenarios } from '@/frontend/lib/projection-utils'

interface ProjectionScenariosInput {
  historicalData: ProjectionDataPoint[]
  contributionSteps: ContributionStep[]
  retirementDate: Date
  settings: {
    projection_pessimistic_rate: number
    projection_realistic_rate: number
    projection_optimistic_rate: number
  }
  historicalContributions: ContributionHistoryResponse[]
}

/**
 * Hook for managing projection scenario calculations with caching and loading states.
 * Uses a single calculation pass for all scenarios to optimize performance.
 */
export function useProjectionScenarios({
  historicalData,
  contributionSteps,
  retirementDate,
  settings,
  historicalContributions
}: ProjectionScenariosInput) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Get the last historical value for projections
  const lastHistoricalValue = useMemo(() => {
    if (historicalData.length === 0) return 0
    return historicalData[historicalData.length - 1].value
  }, [historicalData])

  // Memoize calculation inputs to prevent unnecessary recalculations
  const calculationInputs = useMemo(() => ({
    initialValue: lastHistoricalValue,
    contributionSteps,
    rates: {
      pessimistic: settings.projection_pessimistic_rate,
      realistic: settings.projection_realistic_rate,
      optimistic: settings.projection_optimistic_rate
    },
    startDate: new Date(),
    endDate: retirementDate,
    historicalContributions
  }), [
    lastHistoricalValue,
    contributionSteps,
    settings.projection_pessimistic_rate,
    settings.projection_realistic_rate,
    settings.projection_optimistic_rate,
    retirementDate,
    historicalContributions
  ])

  // Calculate scenarios with memoization
  const scenarios = useMemo(() => {
    try {
      setIsCalculating(true)
      setError(null)
      return calculateCombinedScenarios(calculationInputs)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate scenarios'))
      return null
    } finally {
      setIsCalculating(false)
    }
  }, [calculationInputs])

  // Function to force recalculation if needed
  const recalculate = useCallback(() => {
    setIsCalculating(true)
    try {
      const result = calculateCombinedScenarios(calculationInputs)
      setError(null)
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate scenarios'))
      return null
    } finally {
      setIsCalculating(false)
    }
  }, [calculationInputs])

  return {
    scenarios,
    isCalculating,
    error,
    recalculate
  }
} 