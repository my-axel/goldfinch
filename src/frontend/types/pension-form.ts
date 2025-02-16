import { PensionType, ContributionFrequency } from "./pension"

/**
 * Represents a single contribution step in a pension plan
 * @property amount - The contribution amount in euros
 * @property frequency - How often the contribution is made (monthly, quarterly, annually)
 * @property start_date - When the contribution starts
 * @property end_date - Optional end date for the contribution
 */
type ContributionStep = {
  amount: number
  frequency: ContributionFrequency
  start_date: Date
  end_date?: Date
}

/**
 * Base form data shared by all pension types
 * @property type - The type of pension (ETF, Insurance, Company)
 * @property name - User-defined name for the pension plan
 * @property member_id - ID of the household member this pension belongs to
 * @property initial_capital - Initial investment amount in euros
 */
type BaseFormData = {
  type: PensionType
  name: string
  member_id: string
  initial_capital: number
  start_date: Date
}

/**
 * Complete form data type with pension-specific fields
 * Uses discriminated union based on pension type to ensure type safety
 */
export type FormData = (
  | { 
      type: PensionType.ETF_PLAN
      etf_id: string  // Single ETF instead of allocation
      is_existing_investment: boolean
      existing_units: number  // Changed from optional to required with default 0
      reference_date: Date    // Changed from optional to required with default current date
      realize_historical_contributions: boolean  // Whether to automatically realize past contributions
      initialization_method: "none" | "existing" | "historical"  // The selected initialization method
      contribution_plan: ContributionStep[]
    }
  | { 
      type: PensionType.INSURANCE
      provider: string
      contract_number: string
      guaranteed_interest: number
      expected_return: number
    }
  | { 
      type: PensionType.COMPANY
      employer: string
      vesting_period: number
      matching_percentage: number        // Changed from optional to required with default 0
      max_employer_contribution: number  // Changed from optional to required with default 0
    }
) & BaseFormData