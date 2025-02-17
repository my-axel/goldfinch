import { PensionType, ContributionFrequency } from "./pension"

/**
 * Represents a single contribution step in a pension plan
 */
export type ContributionPlanStep = {
  amount: number
  frequency: ContributionFrequency
  start_date: Date
  end_date?: Date
}

/**
 * ETF Pension form data
 */
export type ETFPensionFormData = {
  type: PensionType.ETF_PLAN
  name: string
  member_id: string
  notes?: string
  start_date: Date
  etf_id: string
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
  vesting_period: number
  matching_percentage: number
  max_employer_contribution: number
  contribution_plan_steps: ContributionPlanStep[]
}