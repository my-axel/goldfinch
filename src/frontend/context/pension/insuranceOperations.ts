/**
 * Pension Context - Insurance Operations
 * 
 * This file contains operations specific to Insurance pensions.
 * Each operation follows the factory pattern, taking dependencies as parameters
 * and returning the actual operation function.
 * 
 * Operations:
 * ----------
 * - createInsurancePensionOperation: Creates a new Insurance pension
 * - updateInsurancePensionOperation: Updates an existing Insurance pension
 * - createInsurancePensionWithStatementOperation: Creates an Insurance pension with statements
 * - deleteInsurancePensionStatementOperation: Deletes a statement from an Insurance pension
 * 
 * How to Add a New Insurance Operation:
 * -----------------------------------
 * 1. Define the operation function following the factory pattern
 * 2. Export the operation function
 * 3. Add the operation to the PensionContextType interface in types.ts
 * 4. Initialize and use the operation in index.tsx
 */

import { InsurancePension, PensionType, Pension } from '@/frontend/types/pension'
import { getPensionApiRoute, getPensionApiRouteWithId } from '@/frontend/lib/routes/api/pension'
import { toast } from 'sonner'
import { toISODateString } from '@/frontend/lib/dateUtils'
import { safeNumberValue } from '@/frontend/lib/transforms'

// API function types
type ApiPost = <T>(url: string, data: unknown) => Promise<T>
type ApiPut = <T>(url: string, data: unknown) => Promise<T>
type ApiDelete = (url: string) => Promise<void>

/**
 * Creates a new Insurance pension
 * 
 * @param post - The API post function
 * @param fetchPensions - Function to fetch all pensions
 * @returns A function that creates an Insurance pension
 */
export function createInsurancePensionOperation(
  post: ApiPost,
  fetchPensions: () => Promise<void>
) {
  return async (pension: Omit<InsurancePension, 'id' | 'current_value'>): Promise<InsurancePension> => {
    try {
      const pensionData = {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        start_date: toISODateString(pension.start_date),
        guaranteed_interest: safeNumberValue(pension.guaranteed_interest),
        expected_return: safeNumberValue(pension.expected_return),
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: toISODateString(step.start_date),
          end_date: step.end_date ? toISODateString(step.end_date) : null
        }))
      }
      
      const response = await post<InsurancePension>(getPensionApiRoute(PensionType.INSURANCE), pensionData)
      await fetchPensions()
      return response
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to create insurance pension'
      })
      throw err
    }
  }
}

/**
 * Creates a new statement for an Insurance pension
 */
export function createInsurancePensionStatementOperation(
  post: ApiPost
) {
  return async (
    pensionId: number,
    data: {
      statement_date: string,
      value: number,
      total_contributions: number,
      total_benefits: number,
      costs_amount: number,
      costs_percentage: number,
      note?: string,
      projections?: Array<{
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
      }>
    }
  ): Promise<void> => {
    try {
      await post(
        `${getPensionApiRoute(PensionType.INSURANCE)}/${pensionId}/statements`,
        data
      )
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to create insurance pension statement'
      })
      throw err
    }
  }
}

/**
 * Updates a statement for an Insurance pension
 * 
 * @param put - The API put function
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that updates an Insurance pension statement
 */
export function updateInsurancePensionStatementOperation(
  put: ApiPut,
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (
    pensionId: number,
    statementId: number,
    data: {
      statement_date: string,
      value: number,
      total_contributions: number,
      total_benefits: number,
      costs_amount: number,
      costs_percentage: number,
      note?: string,
      projections?: Array<{
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
      }>
    }
  ): Promise<void> => {
    try {
      await put(
        `${getPensionApiRoute(PensionType.INSURANCE)}/${pensionId}/statements/${statementId}`,
        {
          ...data,
          statement_date: toISODateString(data.statement_date)
        }
      )
      
      // Refresh the pension data
      if (selectedPension?.id === pensionId) {
        await fetchPension(pensionId, PensionType.INSURANCE)
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
 * Creates an Insurance pension with statements
 */
export function createInsurancePensionWithStatementOperation(
  createInsurancePension: (pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<InsurancePension>,
  createInsurancePensionStatement: (
    pensionId: number,
    data: {
      statement_date: string,
      value: number,
      total_contributions: number,
      total_benefits: number,
      costs_amount: number,
      costs_percentage: number,
      note?: string,
      projections?: Array<{
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
      }>
    }
  ) => Promise<void>
) {
  return async (
    pension: Omit<InsurancePension, 'id' | 'current_value'>,
    statements: Array<{
      statement_date: string,
      value: number,
      total_contributions: number,
      total_benefits: number,
      costs_amount: number,
      costs_percentage: number,
      note?: string,
      projections?: Array<{
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
      }>
    }>
  ): Promise<void> => {
    try {
      // First create the pension
      const newPension = await createInsurancePension(pension)
      
      // Then create each statement
      for (const statement of statements) {
        await createInsurancePensionStatement(newPension.id, statement)
      }
      
      toast.success('Success', {
        description: 'Insurance pension with statements created successfully'
      })
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to create insurance pension with statements'
      })
      throw error
    }
  }
}

/**
 * Updates an existing Insurance pension
 * 
 * @param put - The API put function
 * @param fetchPensions - Function to fetch all pensions
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that updates an Insurance pension
 */
export function updateInsurancePensionOperation(
  put: ApiPut,
  fetchPensions: () => Promise<void>,
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>): Promise<void> => {
    try {
      await put<Pension>(getPensionApiRouteWithId(PensionType.INSURANCE, id), {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        start_date: toISODateString(pension.start_date),
        guaranteed_interest: safeNumberValue(pension.guaranteed_interest),
        expected_return: safeNumberValue(pension.expected_return),
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          id: step.id,
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: toISODateString(step.start_date),
          end_date: step.end_date ? toISODateString(step.end_date) : null,
          note: step.note || null
        })),
        statements: pension.statements?.map(statement => ({
          id: statement.id,
          statement_date: toISODateString(statement.statement_date),
          value: Number(statement.value),
          total_contributions: Number(statement.total_contributions),
          total_benefits: Number(statement.total_benefits),
          costs_amount: Number(statement.costs_amount),
          costs_percentage: Number(statement.costs_percentage),
          note: statement.note,
          projections: statement.projections?.map(projection => ({
            id: projection.id,
            scenario_type: projection.scenario_type,
            return_rate: Number(projection.return_rate),
            value_at_retirement: Number(projection.value_at_retirement),
            monthly_payout: Number(projection.monthly_payout)
          })) || []
        })) || []
      })
      
      await fetchPensions()
      if (selectedPension?.id === id) {
        await fetchPension(id, PensionType.INSURANCE)
      }
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to update insurance pension'
      })
      throw err
    }
  }
}

/**
 * Updates an Insurance pension with statements
 * 
 * @param updateInsurancePension - Function to update an Insurance pension
 * @param updateInsurancePensionStatement - Function to update an Insurance pension statement
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that updates an Insurance pension with statements
 */
export function updateInsurancePensionWithStatementOperation(
  updateInsurancePension: (id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<void>,
  updateInsurancePensionStatement: (
    pensionId: number, 
    statementId: number, 
    data: {
      statement_date: string,
      value: number,
      total_contributions: number,
      total_benefits: number,
      costs_amount: number,
      costs_percentage: number,
      note?: string,
      projections?: Array<{
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
      }>
    }
  ) => Promise<void>,
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (
    id: number, 
    pension: Omit<InsurancePension, 'id' | 'current_value'>,
    statements: Array<{
      id: number,
      statement_date: string,
      value: number,
      total_contributions: number,
      total_benefits: number,
      costs_amount: number,
      costs_percentage: number,
      note?: string,
      projections?: Array<{
        id?: number,
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
      }>
    }>
  ): Promise<void> => {
    try {
      // First, update the pension without statements
      const pensionData = { ...pension }
      // Ensure we're not sending statements in the pension update
      if ('statements' in pensionData) {
        // Use a type that includes optional statements property
        type PensionWithOptionalStatements = Omit<InsurancePension, 'id' | 'current_value'> & { statements?: unknown }
        delete (pensionData as PensionWithOptionalStatements).statements
      }
      
      await updateInsurancePension(id, pensionData)
      
      // Then, update each statement separately
      if (statements && statements.length > 0) {
        for (const statement of statements) {
          const { id: statementId, ...statementData } = statement
          
          await updateInsurancePensionStatement(id, statementId, statementData)
        }
      }
      
      // Refresh the pension data
      if (selectedPension?.id === id) {
        await fetchPension(id, PensionType.INSURANCE)
      }
      
      toast.success('Success', {
        description: 'Insurance pension and statements updated successfully'
      })
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to update insurance pension with statements'
      })
      throw error
    }
  }
}

/**
 * Deletes a statement from an Insurance pension
 * 
 * @param del - The API delete function
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that deletes an Insurance pension statement
 */
export function deleteInsurancePensionStatementOperation(
  del: ApiDelete,
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (pensionId: number, statementId: number): Promise<void> => {
    try {
      await del(`${getPensionApiRoute(PensionType.INSURANCE)}/${pensionId}/statements/${statementId}`)
      
      // Refresh the pension data
      if (selectedPension?.id === pensionId) {
        await fetchPension(pensionId, PensionType.INSURANCE)
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
