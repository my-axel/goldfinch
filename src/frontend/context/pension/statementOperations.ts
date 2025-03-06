/**
 * Pension Context - Statement Operations
 * 
 * This file contains operations related to pension statements.
 * Each operation follows the factory pattern, taking dependencies as parameters
 * and returning the actual operation function.
 * 
 * Operations:
 * ----------
 * - createCompanyPensionStatementOperation: Creates a new statement for a company pension
 * - getCompanyPensionStatementsOperation: Gets all statements for a company pension
 * - getLatestCompanyPensionStatementOperation: Gets the latest statement for a company pension
 * - getCompanyPensionStatementOperation: Gets a specific statement for a company pension
 * - updateCompanyPensionStatementOperation: Updates a statement for a company pension
 * - deleteCompanyPensionStatementOperation: Deletes a statement from a company pension
 * 
 * How to Add a New Statement Operation:
 * -----------------------------------
 * 1. Define the operation function following the factory pattern
 * 2. Export the operation function
 * 3. Add the operation to the PensionContextType interface in types.ts
 * 4. Initialize and use the operation in index.tsx
 */

import { PensionType, PensionCompanyStatement, Pension } from '@/frontend/types/pension'
import { getPensionApiRoute } from '@/frontend/lib/routes/api/pension'
import { toast } from 'sonner'
import { toISODateString } from '@/frontend/lib/dateUtils'

// API function types
type ApiGet = <T>(url: string) => Promise<T>
type ApiPost = <T>(url: string, data: unknown) => Promise<T>
type ApiPut = <T>(url: string, data: unknown) => Promise<T>
type ApiDelete = (url: string) => Promise<void>

/**
 * Creates a new statement for a company pension
 * 
 * @param post - The API post function
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that creates a company pension statement
 */
export function createCompanyPensionStatementOperation(
  post: ApiPost,
  fetchPension: (id: number) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (
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
  ): Promise<void> => {
    try {
      await post(`${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements`, {
        ...data,
        statement_date: toISODateString(data.statement_date)
      })
      
      // Refresh the pension data
      if (selectedPension?.id === pensionId) {
        await fetchPension(pensionId)
      }
      
      toast.success('Success', {
        description: 'Statement has been added'
      })
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to add statement'
      })
      throw error
    }
  }
}

/**
 * Gets all statements for a company pension
 * 
 * @param get - The API get function
 * @returns A function that gets all company pension statements
 */
export function getCompanyPensionStatementsOperation(
  get: ApiGet
) {
  return async (pensionId: number): Promise<PensionCompanyStatement[]> => {
    try {
      const statements = await get<PensionCompanyStatement[]>(
        `${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements`
      )
      return statements
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to fetch statements'
      })
      throw error
    }
  }
}

/**
 * Gets the latest statement for a company pension
 * 
 * @param get - The API get function
 * @returns A function that gets the latest company pension statement
 */
export function getLatestCompanyPensionStatementOperation(
  get: ApiGet
) {
  return async (pensionId: number): Promise<PensionCompanyStatement | null> => {
    try {
      const statement = await get<PensionCompanyStatement | null>(
        `${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements/latest`
      )
      return statement
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to fetch latest statement'
      })
      throw error
    }
  }
}

/**
 * Gets a specific statement for a company pension
 * 
 * @param get - The API get function
 * @returns A function that gets a specific company pension statement
 */
export function getCompanyPensionStatementOperation(
  get: ApiGet
) {
  return async (pensionId: number, statementId: number): Promise<PensionCompanyStatement> => {
    try {
      const statement = await get<PensionCompanyStatement>(
        `${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements/${statementId}`
      )
      return statement
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to fetch statement'
      })
      throw error
    }
  }
}

/**
 * Updates a statement for a company pension
 * 
 * @param put - The API put function
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that updates a company pension statement
 */
export function updateCompanyPensionStatementOperation(
  put: ApiPut,
  fetchPension: (id: number) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (
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
  ): Promise<void> => {
    try {
      await put(
        `${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements/${statementId}`, 
        {
          ...data,
          statement_date: toISODateString(data.statement_date)
        }
      )
      
      // Refresh the pension data
      if (selectedPension?.id === pensionId) {
        await fetchPension(pensionId)
      }
      
      toast.success('Success', {
        description: 'Statement has been updated'
      })
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to update statement'
      })
      throw error
    }
  }
}

/**
 * Deletes a statement from a company pension
 * 
 * @param del - The API delete function
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that deletes a company pension statement
 */
export function deleteCompanyPensionStatementOperation(
  del: ApiDelete,
  fetchPension: (id: number) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (
    pensionId: number,
    statementId: number
  ): Promise<void> => {
    try {
      await del(`${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements/${statementId}`)
      
      // Refresh the pension data
      if (selectedPension?.id === pensionId) {
        await fetchPension(pensionId)
      }
      
      toast.success('Success', {
        description: 'Statement has been deleted'
      })
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to delete statement'
      })
      throw error
    }
  }
} 