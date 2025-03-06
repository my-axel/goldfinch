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
  return async (pension: Omit<InsurancePension, 'id' | 'current_value'>): Promise<void> => {
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
        })),
        statements: pension.statements?.map(statement => ({
          statement_date: toISODateString(statement.statement_date),
          value: Number(statement.value),
          total_contributions: Number(statement.total_contributions),
          total_benefits: Number(statement.total_benefits),
          costs_amount: Number(statement.costs_amount),
          costs_percentage: Number(statement.costs_percentage),
          note: statement.note,
          projections: statement.projections?.map(projection => ({
            scenario_type: projection.scenario_type,
            return_rate: Number(projection.return_rate),
            value_at_retirement: Number(projection.value_at_retirement),
            monthly_payout: Number(projection.monthly_payout)
          })) || []
        })) || []
      }
      
      await post<InsurancePension>(getPensionApiRoute(PensionType.INSURANCE), pensionData)
      await fetchPensions()
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to create insurance pension'
      })
      throw err
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
  fetchPension: (id: number) => Promise<void>,
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
      
      fetchPensions()
      if (selectedPension?.id === id) {
        fetchPension(id)
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
 * Deletes a statement from an Insurance pension
 * 
 * @param del - The API delete function
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that deletes an Insurance pension statement
 */
export function deleteInsurancePensionStatementOperation(
  del: ApiDelete,
  fetchPension: (id: number) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (pensionId: number, statementId: number): Promise<void> => {
    try {
      await del(`${getPensionApiRoute(PensionType.INSURANCE)}/${pensionId}/statements/${statementId}`)
      
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
