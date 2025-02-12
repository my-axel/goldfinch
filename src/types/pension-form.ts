import { PensionType, ContributionStep } from "./pension"

// Base form data type
type BaseFormData = {
  type: PensionType
  name: string
  member_id: string
  start_date: Date
  initial_capital: number
  contribution_plan: ContributionStep[]
}

// Complete form data type with pension-specific fields
export type FormData = BaseFormData & (
  | { 
      type: PensionType.ETF_PLAN
      automatic_rebalancing: boolean
      target_allocation?: { etf_id: string; percentage: number }[]
    }
  | { 
      type: PensionType.INSURANCE
      provider: string
      contract_number: string
    }
  | { 
      type: PensionType.COMPANY
      employer: string
      vesting_period: number
    }
) 