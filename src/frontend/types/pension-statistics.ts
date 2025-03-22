import { ContributionHistoryResponse } from './pension'
import { ProjectionScenario } from './projection'

export interface ValueHistoryPoint {
  date: string
  value: number
}

export interface PensionStatistics {
  total_invested_amount: number
  current_value: number
  total_return: number
  annual_return?: number
  contribution_history: ContributionHistoryResponse[]
  value_history: ValueHistoryPoint[]
  projections?: {
    pessimistic: ProjectionScenario
    realistic: ProjectionScenario
    optimistic: ProjectionScenario
  }
  scenarios?: ProjectionScenario[]
}