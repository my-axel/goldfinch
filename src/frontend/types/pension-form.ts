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
}

/**
 * Complete form data type with pension-specific fields
 * Uses discriminated union based on pension type to ensure type safety
 */
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
      guaranteed_interest: number
      expected_return: number
    }
  | { 
      type: PensionType.COMPANY
      employer: string
      vesting_period: number
      start_date: Date
      matching_percentage?: number
      max_employer_contribution?: number
    }
) 