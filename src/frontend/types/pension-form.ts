import { PensionType, ContributionFrequency } from "./pension"

/**
 * Represents a single contribution step in a pension plan
 */
export type ContributionPlanStep = {
  amount: number
  frequency: ContributionFrequency
  start_date: Date
  end_date?: Date | undefined
  note?: string | undefined
}

/**
 * ETF Pension form data
 */
export type ETFPensionFormData = {
  type: PensionType.ETF_PLAN
  name: string
  member_id: string
  notes?: string
  etf_id: string
  is_existing_investment: boolean
  existing_units: number
  reference_date: Date
  realize_historical_contributions: boolean
  initialization_method: "new" | "existing" | "historical" | "none"
  contribution_plan_steps: ContributionPlanStep[]
}

/**
 * Insurance Pension form data
 */
export type InsurancePensionFormData = {
  type: PensionType.INSURANCE
  name: string
  member_id: string
  notes?: string
  start_date: Date
  provider: string
  initial_capital: number
  contract_number: string
  guaranteed_interest: number
  expected_return: number
  contribution_plan_steps: ContributionPlanStep[]
}

/**
 * Company Pension form data
 */
export type CompanyPensionFormData = {
  type: PensionType.COMPANY
  name: string
  member_id: string
  notes?: string
  start_date: Date
  employer: string
  initial_capital: number
  vesting_period: number
  matching_percentage: number
  max_employer_contribution: number
  contribution_plan_steps: ContributionPlanStep[]
}