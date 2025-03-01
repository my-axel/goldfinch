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
 * Represents a retirement projection for a company pension
 */
export type RetirementProjection = {
  id?: number  // Optional ID for new projections
  retirement_age: number
  monthly_payout: number
  total_capital: number
}

/**
 * Represents a pension company statement
 */
export type PensionCompanyStatementFormData = {
  id?: number  // Optional ID for new statements
  statement_date: Date
  value: number
  note?: string
  retirement_projections?: RetirementProjection[]
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
  contribution_amount?: number
  contribution_frequency?: ContributionFrequency
  contribution_plan_steps: ContributionPlanStep[]
  statements?: PensionCompanyStatementFormData[]
}