"use client"

/**
 * Pension Context - Core Module
 * 
 * This file contains the core functionality for the Pension Context:
 * 1. The context creation
 * 2. Core shared operations that are used across pension types
 * 
 * The operations in this file follow the factory pattern, where each operation
 * is a function that takes dependencies as parameters and returns the actual
 * operation function. This approach makes dependencies explicit and improves
 * testability.
 * 
 * Core Operations:
 * ---------------
 * - fetchPensionsOperation: Fetches all pensions
 * - fetchPensionOperation: Fetches a specific pension by ID
 * - deletePensionOperation: Deletes a pension
 * - realizeHistoricalContributionsOperation: Realizes historical contributions
 * - fetchPensionStatisticsOperation: Fetches statistics for a pension
 * - updatePensionStatusOperation: Updates the status of a pension
 * 
 * How to Add a New Core Operation:
 * ------------------------------
 * 1. Define the operation function following the factory pattern
 * 2. Export the operation function
 * 3. Add the operation to the PensionContextType interface in types.ts
 * 4. Initialize and use the operation in index.tsx
 */

import { createContext } from 'react'
import { 
  Pension,
  PensionType,
  ETFPension,
  InsurancePension,
  CompanyPension
} from '@/frontend/types/pension'
import { PensionStatistics, PensionStatusUpdate } from '@/frontend/types/pension-statistics'
import { ETF } from '@/frontend/types/etf'
import { toast } from 'sonner'
import { 
  getPensionApiRoute, 
  getPensionApiRouteWithId,
  getPensionRealizeHistoricalRoute,
  getPensionStatisticsRoute,
  getPensionStatusRoute
} from '@/frontend/lib/routes/api/pension'
import { getETFByIdRoute } from '@/frontend/lib/routes/api/etf'

// Import types
import { PensionContextType } from './types'

// API function type
type ApiGet = <T>(url: string) => Promise<T>

/**
 * The Pension Context
 * This context provides access to all pension-related operations and state
 */
export const PensionContext = createContext<PensionContextType | undefined>(undefined)

/**
 * Fetches all pensions for a member or all members
 * 
 * @param get - The API get function
 * @returns A function that fetches all pensions
 */
export function fetchPensionsOperation(get: <T>(url: string) => Promise<T>) {
  return async (memberId?: number) => {
      try {
        const [etfResponse, insuranceResponse, companyResponse] = await Promise.all([
          get<ETFPension[]>(`${getPensionApiRoute(PensionType.ETF_PLAN)}${memberId ? `?member_id=${memberId}` : ''}`),
          get<InsurancePension[]>(`${getPensionApiRoute(PensionType.INSURANCE)}${memberId ? `?member_id=${memberId}` : ''}`),
          get<CompanyPension[]>(`${getPensionApiRoute(PensionType.COMPANY)}${memberId ? `?member_id=${memberId}` : ''}`)
        ])
  
        // Fetch ETF details for ETF pensions
        const etfPensionsWithDetails = await Promise.all(
          etfResponse.map(async (p) => {
            try {
              const etfDetails = await get<ETF>(getETFByIdRoute(p.etf_id))
              return {
                ...p,
                type: PensionType.ETF_PLAN as const,
                etf: etfDetails,
                contribution_plan_steps: p.contribution_plan_steps?.map(step => ({
                  ...step,
                  start_date: new Date(step.start_date),
                  end_date: step.end_date ? new Date(step.end_date) : undefined
                })) || []
              }
            } catch (err) {
              console.error(`Failed to fetch ETF details for pension ${p.id}:`, err)
              return {
                ...p,
                type: PensionType.ETF_PLAN as const,
                contribution_plan_steps: p.contribution_plan_steps?.map(step => ({
                  ...step,
                  start_date: new Date(step.start_date),
                  end_date: step.end_date ? new Date(step.end_date) : undefined
                })) || []
              }
            }
          })
        )
  
        const allPensions = [
          ...etfPensionsWithDetails,
          ...insuranceResponse.map(p => ({
            ...p,
            type: PensionType.INSURANCE as const,
            start_date: new Date(p.start_date),
            contribution_plan_steps: p.contribution_plan_steps?.map(step => ({
              ...step,
              start_date: new Date(step.start_date),
              end_date: step.end_date ? new Date(step.end_date) : undefined
            })) || []
          })),
          ...companyResponse.map(p => ({
            ...p,
            type: PensionType.COMPANY as const,
            start_date: new Date(p.start_date),
            contribution_plan_steps: p.contribution_plan_steps?.map(step => ({
              ...step,
              start_date: new Date(step.start_date),
              end_date: step.end_date ? new Date(step.end_date) : undefined
            })) || []
          }))
        ]
  
      return allPensions
      } catch (err) {
        toast.error('Error', {
          description: 'Failed to fetch pensions'
        })
        throw err
      }
  }
}

/**
 * Fetches a specific pension by ID
 * 
 * @param get - The API get function
 * @returns A function that fetches a pension by ID
 */
export function fetchPensionOperation(
  get: ApiGet
) {
  return async (id: number, pensionType?: PensionType) => {
      try {
        // If pension type is provided, use it directly
        if (pensionType) {
          const apiRoute = getPensionApiRouteWithId(pensionType, id);
          
          switch (pensionType) {
            case PensionType.ETF_PLAN: {
              const response = await get<ETFPension>(apiRoute);
              const pension = {
                ...response,
                type: PensionType.ETF_PLAN,
                contribution_plan_steps: response.contribution_plan_steps?.map(step => ({
                  ...step,
                  start_date: new Date(step.start_date),
                  end_date: step.end_date ? new Date(step.end_date) : undefined
                })) || []
              } as ETFPension;
            return pension;
            }
            case PensionType.INSURANCE: {
              const response = await get<InsurancePension>(apiRoute);
              const pension = {
                ...response,
                type: PensionType.INSURANCE,
                start_date: new Date(response.start_date),
                contribution_plan_steps: response.contribution_plan_steps?.map(step => ({
                  ...step,
                  start_date: new Date(step.start_date),
                  end_date: step.end_date ? new Date(step.end_date) : undefined
                })) || []
              } as InsurancePension;
            return pension;
            }
            case PensionType.COMPANY: {
              const response = await get<CompanyPension>(apiRoute);
              const pension = {
                ...response,
                type: PensionType.COMPANY,
                start_date: new Date(response.start_date),
                contribution_plan_steps: response.contribution_plan_steps?.map(step => ({
                  ...step,
                  start_date: new Date(step.start_date),
                  end_date: step.end_date ? new Date(step.end_date) : undefined
                })) || []
              } as CompanyPension;
            return pension;
            }
            default:
              throw new Error('Unknown pension type');
          }
        }
        
      // If no type provided, try all pension types
          // Try ETF pension first as it's the most common
          try {
            console.info(`[PensionContext] Trying to fetch pension ${id} as ETF pension`)
            const response = await get<ETFPension>(`${getPensionApiRoute(PensionType.ETF_PLAN)}/${id}`)
            const pension = {
              ...response,
              type: PensionType.ETF_PLAN,
              contribution_plan_steps: response.contribution_plan_steps?.map(step => ({
                ...step,
                start_date: new Date(step.start_date),
                end_date: step.end_date ? new Date(step.end_date) : undefined
              })) || []
            } as ETFPension
        return pension
          } catch (err) {
            console.info(`[PensionContext] Pension ${id} is not an ETF pension, trying insurance pension:`, err)
            // If not ETF, try insurance
            try {
              const response = await get<InsurancePension>(`${getPensionApiRoute(PensionType.INSURANCE)}/${id}`)
              const pension = {
                ...response,
                type: PensionType.INSURANCE,
                start_date: new Date(response.start_date),
                contribution_plan_steps: response.contribution_plan_steps?.map(step => ({
                  ...step,
                  start_date: new Date(step.start_date),
                  end_date: step.end_date ? new Date(step.end_date) : undefined
                })) || []
              } as InsurancePension
          return pension
            } catch (err) {
              console.info(`[PensionContext] Pension ${id} is not an insurance pension, trying company pension:`, err)
              // If not insurance, try company
              try {
                const response = await get<CompanyPension>(`${getPensionApiRoute(PensionType.COMPANY)}/${id}`)
                const pension = {
                  ...response,
                  type: PensionType.COMPANY,
                  start_date: new Date(response.start_date),
                  contribution_plan_steps: response.contribution_plan_steps?.map(step => ({
                    ...step,
                    start_date: new Date(step.start_date),
                    end_date: step.end_date ? new Date(step.end_date) : undefined
                  })) || []
                } as CompanyPension
            return pension
              } catch (err) {
                console.info(`[PensionContext] Pension ${id} not found in any pension type:`, err)
                throw new Error('Pension not found')
              }
            }
          }
    } catch (err) {
      throw err
    }
  }
}

/**
 * Deletes a pension by ID
 * 
 * @param del - The API delete function
 * @param pensions - The current list of pensions
 * @returns A function that deletes a pension
 */
export function deletePensionOperation(
  del: (url: string) => Promise<void>,
  pensions: Pension[]
) {
  return async (id: number) => {
    try {
      // First, find the pension type from our local state
      const pension = pensions.find(p => p.id === id)
      if (!pension) {
        throw new Error('Pension not found')
      }

      // Then use the appropriate endpoint
      await del(getPensionApiRouteWithId(pension.type, id))
      
      toast.success('Success', {
        description: 'Pension has been deleted'
      })
      
      return true
      } catch (err) {
        toast.error('Error', {
        description: 'Failed to delete pension'
        })
        throw err
      }
  }
}

/**
 * Realizes historical contributions for a pension
 * 
 * @param post - The API post function
 * @param fetchPension - Function to fetch a pension
 * @param pensions - The current list of pensions
 * @returns A function that realizes historical contributions
 */
export function realizeHistoricalContributionsOperation(
  post: <T>(url: string, data: unknown) => Promise<T>,
  fetchPension: (id: number) => Promise<void>,
  pensions: Pension[]
) {
  return async (pensionId: number) => {
      try {
        // First, find the pension type from our local state
        const pension = pensions.find(p => p.id === pensionId)
        if (!pension) {
          throw new Error('Pension not found')
        }
  
        // Then use the appropriate endpoint
        await post(getPensionRealizeHistoricalRoute(pension.type, pensionId), {})
        await fetchPension(pensionId)
        
        toast.success('Success', {
          description: 'Historical contributions have been realized'
        })
      } catch (err) {
        toast.error('Error', {
          description: 'Failed to realize historical contributions'
        })
        throw err
      }
  }
}

/**
 * Fetches statistics for a pension
 * 
 * @param get - The API get function
 * @param pensions - The current list of pensions
 * @returns A function that fetches pension statistics
 */
export function fetchPensionStatisticsOperation(
  get: <T>(url: string) => Promise<T>,
  pensions: Pension[]
) {
  return async (pensionId: number, pensionType?: PensionType) => {
    try {
      // If pension type is not provided, try to find it from our local state
      if (!pensionType) {
        const pension = pensions.find(p => p.id === pensionId)
        if (!pension) {
          throw new Error('Pension not found')
        }
        pensionType = pension.type
      }
      
      const statistics = await get<PensionStatistics>(getPensionStatisticsRoute(pensionType, pensionId))
      return statistics
      } catch (err) {
        toast.error('Error', {
          description: 'Failed to fetch pension statistics'
        })
        throw err
      }
  }
}

/**
 * Updates the status of a pension
 * 
 * @param put - The API put function
 * @param fetchPension - Function to fetch a pension
 * @param pensions - The current list of pensions
 * @returns A function that updates pension status
 */
export function updatePensionStatusOperation(
  put: <T>(url: string, data: unknown) => Promise<T>,
  fetchPension: (id: number) => Promise<void>,
  pensions: Pension[]
) {
  return async (pensionId: number, status: PensionStatusUpdate) => {
    try {
      // First, find the pension type from our local state
        const pension = pensions.find(p => p.id === pensionId)
        if (!pension) {
          throw new Error('Pension not found')
        }
  
      // Then use the appropriate endpoint
        await put(getPensionStatusRoute(pension.type, pensionId), status as unknown as Record<string, unknown>)
        
      // Refresh the pension data
      await fetchPension(pensionId)
        
        toast.success('Success', {
        description: 'Pension status has been updated'
        })
      } catch (err) {
        toast.error('Error', {
        description: 'Failed to update pension status'
        })
        throw err
      }
  }
  } 