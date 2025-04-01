import { PensionType, ContributionFrequency, CompoundingFrequency } from "./pension"

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
 * Insurance pension statement projection data
 */
export interface InsurancePensionProjectionFormData {
  id?: number               // Optional for new projections
  statement_id?: number     // Optional for new projections
  scenario_type: 'with_contributions' | 'without_contributions'
  return_rate: number
  value_at_retirement: number
  monthly_payout: number
}

/**
 * Insurance pension statement data
 */
export interface InsurancePensionStatementFormData {
  id?: number                // Optional for new statements
  pension_id?: number        // Optional for new statements
  statement_date: Date       // Use Date for form state
  value: number
  total_contributions: number
  total_benefits: number
  costs_amount: number
  costs_percentage: number
  note?: string
  projections: InsurancePensionProjectionFormData[]
}

/**
 * Insurance Pension form data - matches InsurancePension type exactly,
 * except member_id is string for form input handling
 */
export type InsurancePensionFormData = {
  type: PensionType.INSURANCE
  name: string
  member_id: string         // String for form input, converted to number on submit
  start_date: Date
  notes?: string
  provider: string
  contract_number?: string
  guaranteed_interest?: number
  expected_return?: number
  contribution_plan_steps: ContributionPlanStep[]
  statements: InsurancePensionStatementFormData[]
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

/**
 * State pension statement data for forms
 */
export interface StatePensionStatementFormData {
  id?: number                // Optional for new statements
  pension_id?: number        // Optional for new statements
  statement_date: Date       // Use Date for form state
  current_monthly_amount?: number
  projected_monthly_amount?: number
  current_value?: number
  note?: string
}

/**
 * State Pension form data
 */
export type StatePensionFormData = {
  type: PensionType.STATE
  name: string
  member_id: string         // String for form input, converted to number on submit
  start_date: Date
  notes?: string
  status: 'ACTIVE' | 'PAUSED'
  statements: StatePensionStatementFormData[]
}

/**
 * Savings Pension statement form data
 */
export type SavingsPensionStatementFormData = {
  id?: number
  statement_date: Date
  balance: number
  note?: string
}

/**
 * Savings Pension form data
 */
export type SavingsPensionFormData = {
  type: PensionType.SAVINGS
  name: string
  member_id: string         // String for form input, converted to number on submit
  start_date: Date
  notes?: string
  
  // Interest rates for different scenarios (in percentage)
  pessimistic_rate: number
  realistic_rate: number
  optimistic_rate: number
  
  // How often interest is compounded
  compounding_frequency: CompoundingFrequency
  
  // Status management
  status: 'ACTIVE' | 'PAUSED'
  
  // Related data
  statements: SavingsPensionStatementFormData[]
  contribution_plan_steps: ContributionPlanStep[]
}