import { PensionType, ContributionFrequency } from "./pension"

type ContributionStep = {
  amount: number
  frequency: ContributionFrequency
  start_date: Date
  end_date?: Date
}

// Base form data type
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
      etf_id: string  // Single ETF instead of allocation
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