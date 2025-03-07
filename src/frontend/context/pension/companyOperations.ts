/**
 * Pension Context - Company Operations
 * 
 * This file contains operations specific to Company pensions.
 * Each operation follows the factory pattern, taking dependencies as parameters
 * and returning the actual operation function.
 * 
 * Operations:
 * ----------
 * - createCompanyPensionOperation: Creates a new Company pension
 * - updateCompanyPensionOperation: Updates an existing Company pension
 * - createCompanyPensionWithStatementOperation: Creates a Company pension with a statement
 * - updateCompanyPensionWithStatementOperation: Updates a Company pension with statements
 * - addOneTimeInvestmentOperation: Adds a one-time investment to a pension
 * - createContributionHistoryOperation: Creates a contribution history entry
 * 
 * How to Add a New Company Operation:
 * ---------------------------------
 * 1. Define the operation function following the factory pattern
 * 2. Export the operation function
 * 3. Add the operation to the PensionContextType interface in types.ts
 * 4. Initialize and use the operation in index.tsx
 */

import { CompanyPension, PensionType, Pension } from '@/frontend/types/pension'
import { 
  getPensionApiRoute, 
  getPensionApiRouteWithId, 
  getPensionOneTimeInvestmentRoute 
} from '@/frontend/lib/routes/api/pension'
import { toast } from 'sonner'
import { toISODateString } from '@/frontend/lib/dateUtils'

// API function types
type ApiPost = <T>(url: string, data: unknown) => Promise<T>
type ApiPut = <T>(url: string, data: unknown) => Promise<T>

/**
 * Creates a new Company pension
 * 
 * @param post - The API post function
 * @param fetchPensions - Function to fetch all pensions
 * @returns A function that creates a Company pension
 */
export function createCompanyPensionOperation(
  post: ApiPost,
  fetchPensions: () => Promise<void>
) {
  return async (pension: Omit<CompanyPension, 'id' | 'current_value'>): Promise<CompanyPension> => {
    try {
      // Format the pension data for the API
      const pensionData = {
        name: pension.name,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        notes: pension.notes,
        employer: pension.employer,
        start_date: pension.start_date,
        contribution_amount: pension.contribution_amount ? Number(pension.contribution_amount) : undefined,
        contribution_frequency: pension.contribution_frequency || undefined,
        status: pension.status || 'ACTIVE',
        paused_at: pension.paused_at || undefined,
        resume_at: pension.resume_at || undefined,
        type: PensionType.COMPANY,
        contribution_plan_steps: pension.contribution_plan_steps?.map(step => ({
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: step.start_date,
          end_date: step.end_date || undefined,
          note: step.note || undefined
        })) || []
      } as const
      
      // Send data to the API - type is handled by the endpoint
      const response = await post<CompanyPension>(getPensionApiRoute(PensionType.COMPANY), pensionData)
      await fetchPensions()
      return response
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to create company pension'
      })
      throw err
    }
  }
}

/**
 * Updates an existing Company pension
 * 
 * @param put - The API put function
 * @param fetchPensions - Function to fetch all pensions
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that updates a Company pension
 */
export function updateCompanyPensionOperation(
  put: ApiPut,
  fetchPensions: () => Promise<void>,
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>): Promise<void> => {
    try {
      await put<Pension>(getPensionApiRouteWithId(PensionType.COMPANY, id), {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          id: step.id,
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: toISODateString(step.start_date),
          end_date: step.end_date ? toISODateString(step.end_date) : null,
          note: step.note || null
        }))
      })
      
      fetchPensions()
      if (selectedPension?.id === id) {
        await fetchPension(id, PensionType.COMPANY)
      }
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to update company pension'
      })
      throw err
    }
  }
}

/**
 * Creates a Company pension with a statement
 * 
 * @param createCompanyPension - Function to create a Company pension
 * @param createCompanyPensionStatement - Function to create a Company pension statement
 * @returns A function that creates a Company pension with a statement
 */
export function createCompanyPensionWithStatementOperation(
  createCompanyPension: (pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<CompanyPension>,
  createCompanyPensionStatement: (
    pensionId: number, 
    data: {
      statement_date: string,
      value: number,
      note?: string,
      retirement_projections?: Array<{
        retirement_age: number,
        monthly_payout: number,
        total_capital: number
      }>
    }
  ) => Promise<void>
) {
  return async (
    pension: Omit<CompanyPension, 'id' | 'current_value'>,
    statement: {
      statement_date: string,
      value: number,
      note?: string,
      retirement_projections?: Array<{
        retirement_age: number,
        monthly_payout: number,
        total_capital: number
      }>
    }
  ): Promise<void> => {
    try {
      // First create the pension
      const newPension = await createCompanyPension(pension)
      
      // Then add the statement
      await createCompanyPensionStatement(newPension.id, statement)
      
      toast.success('Success', {
        description: 'Company pension with statement created successfully'
      })
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to create company pension with statement'
      })
      throw error
    }
  }
}

/**
 * Updates a Company pension with statements
 * 
 * @param updateCompanyPension - Function to update a Company pension
 * @param updateCompanyPensionStatement - Function to update a Company pension statement
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that updates a Company pension with statements
 */
export function updateCompanyPensionWithStatementOperation(
  updateCompanyPension: (id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<void>,
  updateCompanyPensionStatement: (
    pensionId: number, 
    statementId: number, 
    data: {
      statement_date: string,
      value: number,
      note?: string,
      retirement_projections?: Array<{
        retirement_age: number,
        monthly_payout: number,
        total_capital: number
      }>
    }
  ) => Promise<void>,
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (
    id: number, 
    pension: Omit<CompanyPension, 'id' | 'current_value'>,
    statements: Array<{
      id: number,
      statement_date: string,
      value: number,
      note?: string,
      retirement_projections?: Array<{
        id?: number,
        retirement_age: number,
        monthly_payout: number,
        total_capital: number
      }>
    }>
  ): Promise<void> => {
    try {
      // First, update the pension without statements
      // Use a type assertion to handle the pension update
      const pensionData = { ...pension };
      // Ensure we're not sending statements in the pension update
      if ('statements' in pensionData) {
        // Use a type that includes optional statements property
        type PensionWithOptionalStatements = Omit<CompanyPension, 'id' | 'current_value'> & { statements?: unknown };
        delete (pensionData as PensionWithOptionalStatements).statements;
      }
      
      await updateCompanyPension(id, pensionData as Omit<CompanyPension, 'id' | 'current_value'>)
      
      // Then, update each statement separately
      if (statements && statements.length > 0) {
        for (const statement of statements) {
          const { id: statementId, ...statementData } = statement
          
          await updateCompanyPensionStatement(id, statementId, statementData)
        }
      }
      
      // Refresh the pension data
      if (selectedPension?.id === id) {
        await fetchPension(id, PensionType.COMPANY)
      }
      
      toast.success('Success', {
        description: 'Company pension and statements updated successfully'
      })
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to update company pension with statements'
      })
      throw error
    }
  }
}

/**
 * Adds a one-time investment to a pension
 * 
 * @param post - The API post function
 * @param fetchPension - Function to fetch a specific pension
 * @param pensions - The current list of pensions
 * @returns A function that adds a one-time investment
 */
export function addOneTimeInvestmentOperation(
  post: ApiPost,
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>,
  pensions: Pension[]
) {
  return async (
    pensionId: number, 
    data: { 
      amount: number, 
      investment_date: string, 
      note?: string 
    }
  ): Promise<void> => {
    try {
      // First, find the pension type from our local state
      const pension = pensions.find(p => p.id === pensionId)
      if (!pension) {
        throw new Error('Pension not found')
      }

      await post(getPensionOneTimeInvestmentRoute(pension.type, pensionId), {
        ...data,
        amount: Number(data.amount),
        investment_date: toISODateString(data.investment_date)
      })
      await fetchPension(pensionId, PensionType.COMPANY)
      
      toast.success('Success', {
        description: 'One-time investment has been added'
      })
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to add one-time investment'
      })
      throw err
    }
  }
}

/**
 * Creates a contribution history entry
 * 
 * @param post - The API post function
 * @param fetchPension - Function to fetch a specific pension
 * @param pensions - The current list of pensions
 * @returns A function that creates a contribution history entry
 */
export function createContributionHistoryOperation(
  post: ApiPost,
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>,
  pensions: Pension[]
) {
  return async (
    pensionId: number, 
    data: { 
      amount: number, 
      date: string, 
      is_manual: boolean, 
      note?: string 
    }
  ): Promise<void> => {
    try {
      // First, find the pension type from our local state
      const pension = pensions.find(p => p.id === pensionId)
      if (!pension) {
        throw new Error('Pension not found')
      }

      // Only company pensions support contribution history
      if (pension.type !== PensionType.COMPANY) {
        throw new Error('Contribution history is only supported for company pensions')
      }

      await post(`${getPensionApiRoute(pension.type)}/${pensionId}/contribution-history`, data)
      await fetchPension(pensionId, PensionType.COMPANY)
      
      toast.success('Success', {
        description: 'Contribution has been added'
      })
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to add contribution'
      })
      throw err
    }
  }
}
