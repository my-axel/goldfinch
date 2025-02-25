/**
 * Types for projection data and calculations
 */

export type ScenarioType = "pessimistic" | "realistic" | "optimistic"

export const MONTHS_PER_YEAR = 12

export interface ProjectionDataPoint {
  date: Date
  value: number
  contributionAmount?: number
  scenarioType?: ScenarioType
  isProjection?: boolean
}

export interface ProjectionScenario {
  type: ScenarioType
  dataPoints: ProjectionDataPoint[]
  rate: number
  returnRate?: number
  finalValue: number
  totalContributions: number
  totalReturns: number
}

export interface ProjectionTimeRange {
  today: Date
  retirementDate: Date
}

export interface ProjectionChartData {
  dataPoints: ProjectionDataPoint[]
  scenarios: ProjectionScenario[]
  visibleScenarios: Set<ScenarioType>
  timeRange: ProjectionTimeRange
}

export interface ProjectionInput {
  currentValue: number
  monthlyContribution: number
  yearsToRetirement: number
  startDate: Date
  endDate: Date
  historicalData?: ProjectionDataPoint[]
  rates: {
    pessimistic: number
    realistic: number
    optimistic: number
  }
}

export interface ProjectionResult {
  historicalData: ProjectionDataPoint[]
  projections: {
    pessimistic: ProjectionScenario
    realistic: ProjectionScenario
    optimistic: ProjectionScenario
  }
  metadata: {
    startDate: Date
    endDate: Date
    currentValue: number
    totalContributions: number
  }
}

export interface ProjectionColors {
  historical: string
  contributions: string
  scenarios: {
    pessimistic: string
    realistic: string
    optimistic: string
  }
}

export const DEFAULT_PROJECTION_COLORS: ProjectionColors = {
  historical: '#64748b', // slate-500
  contributions: '#94a3b8', // slate-400
  scenarios: {
    pessimistic: '#f97316', // orange-500
    realistic: '#22c55e', // green-500
    optimistic: '#3b82f6' // blue-500
  }
} 