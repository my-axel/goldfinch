/**
 * Pension Context - ETF Operations
 * 
 * This file contains operations specific to ETF pensions.
 * Each operation follows the factory pattern, taking dependencies as parameters
 * and returning the actual operation function.
 * 
 * Operations:
 * ----------
 * - createEtfPensionOperation: Creates a new ETF pension
 * - updateEtfPensionOperation: Updates an existing ETF pension
 * 
 * How to Add a New ETF Operation:
 * -----------------------------
 * 1. Define the operation function following the factory pattern
 * 2. Export the operation function
 * 3. Add the operation to the PensionContextType interface in types.ts
 * 4. Initialize and use the operation in index.tsx
 */

import { ETFPension, PensionType, Pension } from '@/frontend/types/pension'
import { getPensionApiRoute, getPensionApiRouteWithId } from '@/frontend/lib/routes/api/pension'
import { toast } from 'sonner'
import { toISODateString } from '@/frontend/lib/dateUtils'

// API function types
type ApiPost = <T>(url: string, data: unknown) => Promise<T>
type ApiPut = <T>(url: string, data: unknown) => Promise<T>

/**
 * Creates a new ETF pension
 * 
 * @param post - The API post function
 * @param fetchPensions - Function to fetch all pensions
 * @returns A function that creates an ETF pension
 */
export function createEtfPensionOperation(
  post: ApiPost,
  fetchPensions: () => Promise<void>
) {
  return async (pension: Omit<ETFPension, 'id' | 'current_value'>): Promise<void> => {
    try {
      const memberId = typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id
      const pensionData = {
        name: pension.name,
        member_id: memberId,
        notes: pension.notes,
        etf_id: pension.etf_id,
        existing_units: pension.existing_units,
        reference_date: pension.reference_date ? toISODateString(pension.reference_date) : undefined,
        realize_historical_contributions: pension.realize_historical_contributions,
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: toISODateString(step.start_date),
          end_date: step.end_date ? toISODateString(step.end_date) : null
        }))
      }
      
      await post<ETFPension>(getPensionApiRoute(PensionType.ETF_PLAN), pensionData)
      await fetchPensions()
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to create ETF pension'
      })
      throw err
    }
  }
}

/**
 * Updates an existing ETF pension
 * 
 * @param put - The API put function
 * @param fetchPensions - Function to fetch all pensions
 * @param fetchPension - Function to fetch a specific pension
 * @param selectedPension - The currently selected pension
 * @returns A function that updates an ETF pension
 */
export function updateEtfPensionOperation(
  put: ApiPut,
  fetchPensions: () => Promise<void>,
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>,
  selectedPension: Pension | null
) {
  return async (id: number, pension: Omit<ETFPension, 'id' | 'current_value'>): Promise<void> => {
    try {
      await put<Pension>(getPensionApiRouteWithId(PensionType.ETF_PLAN, id), {
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
        await fetchPension(id, PensionType.ETF_PLAN)
      }
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to update ETF pension'
      })
      throw err
    }
  }
}
