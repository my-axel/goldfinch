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
  COMPANY = 'COMPANY',         // Employer-sponsored pension plan
  STATE = 'STATE',             // Government/state pension
  SAVINGS = 'SAVINGS'          // Savings account based pension
}

/** 
 * Defines the frequency at which interest is compounded in a savings account.
 * Used to calculate accurate growth projections.
 */
export enum CompoundingFrequency {
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY'
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
  contribution_date: Date
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

/** 
 * State/Government pension plan that provides retirement income
 * based on employment history and contributions to the system.
 */
export interface StatePension {
  id: number
  type: PensionType.STATE
  name: string
  member_id: number
  start_date: string
  notes?: string
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
  statements?: StatePensionStatement[]
}

/**
 * Statement for state pensions tracking current and projected
 * monthly amounts
 */
export interface StatePensionStatement {
  id: number
  pension_id: number
  statement_date: string
  current_monthly_amount?: number
  projected_monthly_amount?: number
  current_value?: number
  note?: string
}

/**
 * State pension projection scenario used to show different
 * payout scenarios based on retirement age and growth rates
 */
export interface StatePensionScenario {
  monthly_amount: number
  annual_amount: number
  retirement_age: number
  years_to_retirement: number
  growth_rate: number
}

/**
 * State pension projection with different scenarios
 */
export interface StatePensionProjection {
  planned: {
    pessimistic: StatePensionScenario
    realistic: StatePensionScenario
    optimistic: StatePensionScenario
  }
  possible: {
    pessimistic: StatePensionScenario
    realistic: StatePensionScenario
    optimistic: StatePensionScenario
  }
}

/**
 * Lightweight state pension summary for list views
 */
export interface StatePensionList {
  id: number
  name: string
  member_id: number
  start_date: string
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
  latest_statement_date?: string
  latest_monthly_amount?: number
  latest_projected_amount?: number
  latest_current_value?: number
  statements_count: number  // Number of statements available
}

/**
 * Represents a statement for a savings pension plan.
 * Contains information about the account balance at a specific date.
 */
export interface SavingsPensionStatement {
  id: number
  pension_id: number
  statement_date: string
  balance: number
  note?: string
}

/** 
 * Savings pension plan interface with features specific
 * to savings account based retirement planning.
 */
export interface SavingsPension {
  id: number
  type: PensionType.SAVINGS
  name: string
  member_id: number
  start_date: string
  notes?: string
  
  // Interest rates for different scenarios (in percentage)
  pessimistic_rate: number
  realistic_rate: number
  optimistic_rate: number
  
  // How often interest is compounded
  compounding_frequency: CompoundingFrequency
  
  // Status management
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
  
  // Related data
  statements?: SavingsPensionStatement[]
  contribution_plan_steps: ContributionStep[]
}

/**
 * Represents a projection scenario for a savings pension.
 */
export interface SavingsPensionScenario {
  balance: number
  retirement_age: number
  years_to_retirement: number
  growth_rate: number
  total_contributions: number
  balance_without_contributions: number
}

/**
 * Complete projection including both retirement dates.
 */
export interface SavingsPensionProjection {
  planned: {
    pessimistic: SavingsPensionScenario
    realistic: SavingsPensionScenario
    optimistic: SavingsPensionScenario
  }
  possible: {
    pessimistic: SavingsPensionScenario
    realistic: SavingsPensionScenario
    optimistic: SavingsPensionScenario
  }
}

/**
 * Lightweight savings pension schema for list views
 */
export interface SavingsPensionList {
  id: number
  name: string
  member_id: number
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
  latest_balance?: number
  latest_statement_date?: string
  pessimistic_rate: number
  realistic_rate: number
  optimistic_rate: number
  compounding_frequency: CompoundingFrequency
  current_step_amount?: number
  current_step_frequency?: ContributionFrequency
}

/** Union type of all possible pension types */
export type Pension = ETFPension | InsurancePension | CompanyPension | StatePension | SavingsPension

/**
 * Interface for updating pension status with optional date fields
 */
export interface PensionStatusUpdate {
  status: 'ACTIVE' | 'PAUSED'
  paused_at?: string
  resume_at?: string
}

export interface ContributionHistoryResponse {
  id: number
  pension_etf_id: number
  contribution_date: string
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
  | (StatePensionList & { type: PensionType.STATE })
  | (SavingsPensionList & { type: PensionType.SAVINGS })