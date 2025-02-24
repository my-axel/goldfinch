import { ContributionHistoryResponse } from './pension'

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
}

export interface PensionStatusUpdate {
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
}