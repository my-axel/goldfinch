import { ETF } from './etf'

/** 
 * Defines the frequency at which contributions are made to a pension plan.
 * Used in both planned contributions and actual historical records.
 */
export enum ContributionFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY',
  ONE_TIME = 'ONE_TIME'  // Used for initial investments or special contributions
}

/** 
 * Categorizes different types of pension plans, each with its own
 * specific features and requirements. Used to determine which
 * specific pension interface to use.
 */
export enum PensionType {
  ETF_PLAN = 'ETF_PLAN',      // Self-managed ETF-based pension
  INSURANCE = 'INSURANCE',     // Insurance company managed pension
  COMPANY = 'COMPANY'         // Employer-sponsored pension plan
}

/** 
 * Represents a planned contribution step in a pension plan.
 * Each step defines a period during which contributions will be made
 * at a specific frequency and amount. Multiple steps can be used to
 * plan changing contribution patterns over time.
 */
export interface ContributionStep {
  id?: number
  amount: number              // Amount per contribution
  frequency: ContributionFrequency
  start_date: Date
  end_date?: Date | undefined      // If undefined, continues indefinitely
  note?: string | undefined       // Optional note for this contribution step
}

/** 
 * Records an actual contribution that was made to the pension plan.
 * Tracks both the planned and actual amounts, allowing for manual
 * overrides when contributions differ from the plan. Also records
 * how the contribution was allocated across different ETFs.
 */
export interface HistoricalContribution {
  date: Date
  amount: number             // Actual amount contributed
  planned_amount: number     // Amount that was planned for this date
  is_manual_override: boolean // True if contribution differs from plan
  etf_allocations: {
    etf_id: string
    amount: number          // Amount allocated to this ETF
    units_bought: number    // Number of ETF units purchased
  }[]
  note?: string            // Optional note explaining overrides or special circumstances
}

/**
 * Represents an extra contribution made to a company pension plan.
 * Used for tracking yearly or one-time additional investments.
 */
export interface ExtraContribution {
  id: number
  pension_id: number
  amount: number
  date: Date
  note?: string
}

/**
 * Represents a statement for a company pension plan.
 * Contains information about the pension value at a specific date.
 */
export interface PensionCompanyStatement {
  id: number
  pension_id: number
  statement_date: Date
  value: number
  note?: string
  retirement_projections?: PensionCompanyRetirementProjection[]
}

/**
 * Represents a retirement projection for a company pension plan.
 * Contains information about expected retirement benefits based on
 * the latest company pension statement.
 */
export interface PensionCompanyRetirementProjection {
  id: number
  statement_id: number
  retirement_age: number
  monthly_payout: number
  total_capital: number
}

/**
 * TODO: Consider moving enums to shared backend/frontend constants
 * TODO: Add API response types for all interfaces
 * TODO: Add validation decorators for backend ORM
 * TODO: Consider adding created_at and updated_at timestamps
 * TODO: Add soft delete support for historical tracking
 */

/** 
 * ETF-based pension plan interface with features specific
 * to self-managed ETF portfolios.
 * 
 * TODO: Add ETF price update timestamp
 * TODO: Add transaction logging
 * TODO: Consider adding performance metrics
 */
export interface ETFPension {
  id: number
  type: PensionType.ETF_PLAN
  name: string
  member_id: number           // Links to household member
  current_value: number       // Current total value of the pension
  total_units: number        // Total units in the pension
  notes?: string
  etf_id: string
  etf?: ETF
  is_existing_investment: boolean
  existing_units?: number
  reference_date?: Date
  realize_historical_contributions?: boolean  // Whether to automatically realize past contributions
  contribution_plan_steps: ContributionStep[]
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
}

/** 
 * Insurance-based pension plan with guaranteed returns and optional
 * features. Typically managed by an insurance company with specific
 * contractual terms and guarantees.
 */
export interface InsurancePension {
  id: number
  type: PensionType.INSURANCE
  name: string
  member_id: number           // Links to household member
  start_date: Date
  retirement_date?: Date      // Optional retirement date
  notes?: string
  provider: string           // Insurance company name
  contract_number?: string   // Optional contract number
  guaranteed_interest?: number // Minimum guaranteed return
  expected_return?: number    // Expected return including non-guaranteed portions
  contribution_plan_steps: ContributionStep[]
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
  statements?: InsurancePensionStatement[]  // Insurance pension statements
}

/**
 * Insurance pension statement with projections and cost details
 */
export interface InsurancePensionStatement {
  id?: number                // Optional for new statements
  pension_id?: number        // Optional for new statements
  statement_date: string
  value: number
  total_contributions: number
  total_benefits: number
  costs_amount: number
  costs_percentage: number
  note?: string
  projections?: InsurancePensionProjection[]
}

/**
 * Insurance pension projection with different scenarios
 */
export interface InsurancePensionProjection {
  id?: number               // Optional for new projections
  statement_id?: number     // Optional for new projections
  scenario_type: 'with_contributions' | 'without_contributions'
  return_rate: number
  value_at_retirement: number
  monthly_payout: number
}

/** 
 * Company pension plan that includes regular contributions and
 * retirement projections based on company statements.
 */
export interface CompanyPension {
  id: number
  type: PensionType.COMPANY
  name: string
  member_id: number           // Links to household member
  start_date: Date
  current_value: number       // Current total value of the pension
  notes?: string
  employer: string
  
  // New fields replacing employer matching and vesting
  contribution_amount?: number        // Regular contribution amount
  contribution_frequency?: ContributionFrequency  // Frequency of regular contributions
  
  contribution_plan_steps: ContributionStep[]
  contribution_history?: ExtraContribution[]  // History of contributions
  statements?: PensionCompanyStatement[]      // Pension statements
  
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
}

/** Union type of all possible pension types */
export type Pension = ETFPension | InsurancePension | CompanyPension

export interface ContributionHistoryResponse {
  id: number
  pension_etf_id: number
  date: string
  amount: number
  is_manual: boolean
  note?: string
}

/**
 * Lightweight ETF pension schema for list views
 * This is used by the optimized list endpoint
 */
export interface ETFPensionList {
  id: number
  name: string
  member_id: number
  current_value: number
  total_units: number
  etf_id: string
  etf_name: string
  status: 'ACTIVE' | 'PAUSED'
  is_existing_investment: boolean
  existing_units?: number
  paused_at?: string
  resume_at?: string
  current_step_amount?: number
  current_step_frequency?: ContributionFrequency
}

/**
 * Lightweight Company pension schema for list views
 * This is used by the optimized list endpoint
 */
export interface CompanyPensionList {
  id: number
  name: string
  member_id: number
  current_value: number
  employer: string
  start_date: string
  contribution_amount?: number
  contribution_frequency?: ContributionFrequency
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
  current_step_amount?: number
  current_step_frequency?: ContributionFrequency
  latest_statement_date?: string
  latest_projections?: Array<{
    retirement_age: number
    monthly_payout: number
  }>
}

/**
 * Lightweight Insurance pension schema for list views
 * This is used by the optimized list endpoint
 */
export interface InsurancePensionList {
  id: number
  name: string
  member_id: number
  current_value: number
  provider: string
  start_date: string
  contract_number?: string   // Optional contract number
  guaranteed_interest?: number
  expected_return?: number
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
  latest_statement_date?: string
}

/**
 * Union type of all lightweight pension list types
 */
export type PensionList = 
  | (ETFPensionList & { type: PensionType.ETF_PLAN })
  | (CompanyPensionList & { type: PensionType.COMPANY })
  | (InsurancePensionList & { type: PensionType.INSURANCE })