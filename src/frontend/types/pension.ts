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
  GOVERNMENT = 'GOVERNMENT',   // Government pension schemes
  OTHER = 'OTHER'             // Other types of pension plans
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
  end_date?: Date | null      // If undefined, continues indefinitely
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
export interface ETF {
  id: string
  isin: string
  symbol: string
  name: string
  currency: string
  asset_class: string
  domicile: string
  inception_date: string
  fund_size: number
  ter: number
  distribution_policy: string
  last_price: number
  last_update: string
  ytd_return: number
  one_year_return: number
  volatility_30d: number
  sharpe_ratio: number
  historical_prices: Array<{
    date: string
    price: number
    currency: string
  }>
}

export interface ETFPension {
  id: number
  type: PensionType.ETF_PLAN
  name: string
  member_id: number           // Links to household member
  current_value: number       // Current total value of the pension
  notes?: string
  etf_id: string
  etf?: ETF
  is_existing_investment: boolean
  existing_units?: number
  reference_date?: Date
  realize_historical_contributions?: boolean  // Whether to automatically realize past contributions
  contribution_plan_steps: ContributionStep[]
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
  initial_capital: number     // Initial investment amount
  current_value: number       // Current total value of the pension
  notes?: string
  provider: string           // Insurance company name
  contract_number: string
  guaranteed_interest: number // Minimum guaranteed return
  expected_return: number    // Expected return including non-guaranteed portions
  contribution_plan_steps: ContributionStep[]
}

/** 
 * Company pension plan that includes employer contributions and
 * vesting rules. May include matching contributions up to a
 * certain percentage or amount.
 */
export interface CompanyPension {
  id: number
  type: PensionType.COMPANY
  name: string
  member_id: number           // Links to household member
  start_date: Date
  initial_capital: number     // Initial investment amount
  current_value: number       // Current total value of the pension
  notes?: string
  employer: string
  vesting_period: number                   // Years until fully vested
  matching_percentage?: number             // Percentage of employee contribution matched
  max_employer_contribution?: number       // Maximum employer contribution
  contribution_plan_steps: ContributionStep[]
}

/** 
 * Union type representing all possible pension types.
 * Used when handling pensions generically, with type field
 * determining the specific pension interface to use.
 */
export type Pension = ETFPension | InsurancePension | CompanyPension