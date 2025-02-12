import { PensionType, ContributionStep } from "./pension"

// Base form data type without start date
type BaseFormData = {
  type: PensionType
  name: string
  member_id: string
  initial_capital: number
}

// Complete form data type with pension-specific fields
export type FormData = BaseFormData & (
  | { 
      type: PensionType.ETF_PLAN
      automatic_rebalancing: boolean
      target_allocation?: { etf_id: string; percentage: number }[]
      contribution_plan: ContributionStep[]
    }
  | { 
      type: PensionType.INSURANCE
      provider: string
      contract_number: string
      start_date: Date
    }
  | { 
      type: PensionType.COMPANY
      employer: string
      vesting_period: number
      start_date: Date
    }
) 