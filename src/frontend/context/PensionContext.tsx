"use client"

import { createContext, useContext, useState, useCallback } from 'react'
import { useApi } from '@/frontend/hooks/useApi'
import { 
  type Pension,
  type ETFPension,
  type InsurancePension,
  type CompanyPension,
  PensionType
} from '@/frontend/types/pension'
import { type ETF } from '@/frontend/types/etf'
import { type PensionStatistics, type PensionStatusUpdate } from '@/frontend/types/pension-statistics'
import { toast } from 'sonner'
import { 
  getPensionApiRoute, 
  getPensionApiRouteWithId,
  getPensionRealizeHistoricalRoute,
  getPensionOneTimeInvestmentRoute,
  getPensionStatisticsRoute,
  getPensionStatusRoute,
} from '@/frontend/lib/routes/api/pension'
import { getETFByIdRoute } from '@/frontend/lib/routes/api/etf'

export interface PensionContribution {
  id: number
  pension_id: number
  date: string
  amount: number
  planned_amount: number
  is_manual_override: boolean
  note?: string
}

interface PensionContextType {
  isLoading: boolean
  error: string | null
  pensions: Pension[]
  selectedPension: Pension | null
  fetchPensions: (memberId?: number) => Promise<void>
  fetchPension: (id: number) => Promise<void>
  createEtfPension: (pension: Omit<ETFPension, 'id' | 'current_value'>) => Promise<void>
  createInsurancePension: (pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<void>
  createCompanyPension: (pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<void>
  updateEtfPension: (id: number, pension: Omit<ETFPension, 'id' | 'current_value'>) => Promise<void>
  updateInsurancePension: (id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<void>
  updateCompanyPension: (id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<void>
  deletePension: (id: number) => Promise<void>
  addOneTimeInvestment: (pensionId: number, data: { 
    amount: number, 
    investment_date: string, 
    note?: string 
  }) => Promise<void>
  realizeHistoricalContributions: (pensionId: number) => Promise<void>
  getPensionStatistics: (pensionId: number) => Promise<PensionStatistics>
  updatePensionStatus: (pensionId: number, status: PensionStatusUpdate) => Promise<void>
  pensionStatistics: Record<number, PensionStatistics>
  isLoadingStatistics: Record<number, boolean>
  fetchPensionStatistics: (pensionId: number) => Promise<void>
}

const PensionContext = createContext<PensionContextType | undefined>(undefined)

export function PensionProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, error, get, post, del, put } = useApi()
  const [pensions, setPensions] = useState<Pension[]>([])
  const [selectedPension, setSelectedPension] = useState<Pension | null>(null)
  const [pensionStatistics, setPensionStatistics] = useState<Record<number, PensionStatistics>>({})
  const [isLoadingStatistics, setIsLoadingStatistics] = useState<Record<number, boolean>>({})

  const fetchPensions = useCallback(async (memberId?: number) => {
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

      setPensions(allPensions)
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to fetch pensions'
      })
      throw err
    }
  }, [get])

  const fetchPension = useCallback(async (id: number) => {
    try {
      // Try to find the pension type from our local state first
      const localPension = pensions.find(p => p.id === id)
      
      // If we don't have the pension in local state, try all pension types
      if (!localPension) {
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
          setSelectedPension(pension)
          // Also update the pensions array
          setPensions(prev => [...prev.filter(p => p.id !== id), pension])
          return
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
            setSelectedPension(pension)
            // Also update the pensions array
            setPensions(prev => [...prev.filter(p => p.id !== id), pension])
            return
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
              setSelectedPension(pension)
              // Also update the pensions array
              setPensions(prev => [...prev.filter(p => p.id !== id), pension])
              return
            } catch (err) {
              console.info(`[PensionContext] Pension ${id} not found in any pension type:`, err)
              throw new Error('Pension not found')
            }
          }
        }
      }

      // If we have the pension type in local state, use it directly
      const apiRoute = getPensionApiRouteWithId(localPension.type, id)
      
      switch (localPension.type) {
        case PensionType.ETF_PLAN: {
          const response = await get<ETFPension>(apiRoute)
          const pension = {
            ...response,
            type: PensionType.ETF_PLAN,
            contribution_plan_steps: response.contribution_plan_steps?.map(step => ({
              ...step,
              start_date: new Date(step.start_date),
              end_date: step.end_date ? new Date(step.end_date) : undefined
            })) || []
          } as ETFPension
          setSelectedPension(pension)
          // Also update the pensions array
          setPensions(prev => [...prev.filter(p => p.id !== id), pension])
          break
        }
        case PensionType.INSURANCE: {
          const response = await get<InsurancePension>(apiRoute)
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
          setSelectedPension(pension)
          // Also update the pensions array
          setPensions(prev => [...prev.filter(p => p.id !== id), pension])
          break
        }
        case PensionType.COMPANY: {
          const response = await get<CompanyPension>(apiRoute)
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
          setSelectedPension(pension)
          // Also update the pensions array
          setPensions(prev => [...prev.filter(p => p.id !== id), pension])
          break
        }
        default:
          throw new Error('Unknown pension type')
      }
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to fetch pension details'
      })
      throw err
    }
  }, [get, pensions])

  const realizeHistoricalContributions = useCallback(async (pensionId: number) => {
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
  }, [post, fetchPension, pensions])

  const createEtfPension = useCallback(async (pension: Omit<ETFPension, 'id' | 'current_value'>): Promise<void> => {
    try {
      const memberId = typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id
      const pensionData = {
        name: pension.name,
        member_id: memberId,
        notes: pension.notes,
        etf_id: pension.etf_id,
        is_existing_investment: pension.is_existing_investment,
        existing_units: pension.existing_units,
        reference_date: pension.reference_date?.toISOString().split('T')[0],
        realize_historical_contributions: pension.realize_historical_contributions,
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: step.start_date.toISOString().split('T')[0],
          end_date: step.end_date ? step.end_date.toISOString().split('T')[0] : null
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
  }, [post, fetchPensions])

  const createInsurancePension = useCallback(async (pension: Omit<InsurancePension, 'id' | 'current_value'>): Promise<void> => {
    try {
      const pensionData = {
        name: pension.name,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        notes: pension.notes,
        provider: pension.provider,
        contract_number: pension.contract_number,
        start_date: pension.start_date.toISOString().split('T')[0],
        guaranteed_interest: Number(pension.guaranteed_interest),
        expected_return: Number(pension.expected_return),
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: step.start_date.toISOString().split('T')[0],
          end_date: step.end_date ? step.end_date.toISOString().split('T')[0] : null
        }))
      }
      
      await post<InsurancePension>(getPensionApiRoute(PensionType.INSURANCE), pensionData)
      await fetchPensions()
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to create insurance pension'
      })
      throw err
    }
  }, [post, fetchPensions])

  const createCompanyPension = useCallback(async (pension: Omit<CompanyPension, 'id' | 'current_value'>): Promise<void> => {
    try {
      const pensionData = {
        name: pension.name,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        notes: pension.notes,
        employer: pension.employer,
        start_date: pension.start_date.toISOString().split('T')[0],
        vesting_period: Number(pension.vesting_period),
        matching_percentage: Number(pension.matching_percentage),
        max_employer_contribution: Number(pension.max_employer_contribution),
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: step.start_date.toISOString().split('T')[0],
          end_date: step.end_date ? step.end_date.toISOString().split('T')[0] : null
        }))
      }
      
      await post<CompanyPension>(getPensionApiRoute(PensionType.COMPANY), pensionData)
      await fetchPensions()
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to create company pension'
      })
      throw err
    }
  }, [post, fetchPensions])

  const deletePension = useCallback(async (id: number) => {
    try {
      // First, find the pension type from our local state
      const pension = pensions.find(p => p.id === id)
      if (!pension) {
        throw new Error('Pension not found')
      }

      // Store the type before deletion
      const pensionType = pension.type as PensionType

      // Then use the appropriate endpoint based on pension type
      switch (pensionType) {
        case PensionType.ETF_PLAN:
          await del(`${getPensionApiRoute(pensionType)}/${id}`)
          break
        case PensionType.INSURANCE:
          await del(`${getPensionApiRoute(pensionType)}/${id}`)
          break
        case PensionType.COMPANY:
          await del(`${getPensionApiRoute(pensionType)}/${id}`)
          break
        default:
          throw new Error('Unknown pension type')
      }

      // Update local state after successful deletion
      setPensions(prevPensions => prevPensions.filter(p => p.id !== id))
      if (selectedPension?.id === id) {
        setSelectedPension(null)
      }
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to delete pension'
      })
      throw err
    }
  }, [del, setPensions, selectedPension, pensions])

  const addOneTimeInvestment = useCallback(async (
    pensionId: number,
    data: { amount: number, investment_date: string, note?: string }
  ) => {
    try {
      // First, find the pension type from our local state
      const pension = pensions.find(p => p.id === pensionId)
      if (!pension) {
        throw new Error('Pension not found')
      }

      // One-time investments are only supported for ETF pensions
      if (pension.type !== PensionType.ETF_PLAN) {
        throw new Error('One-time investments are only supported for ETF pensions')
      }

      await post(getPensionOneTimeInvestmentRoute(pension.type, pensionId), {
        amount: data.amount,
        investment_date: data.investment_date,
        note: data.note || undefined
      })
      await fetchPension(pensionId)
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to add one-time investment'
      })
      throw err
    }
  }, [post, fetchPension, pensions])

  const updateEtfPension = useCallback(async (id: number, pension: Omit<ETFPension, 'id' | 'current_value'>) => {
    try {
      await put<Pension>(getPensionApiRouteWithId(PensionType.ETF_PLAN, id), {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: new Date(step.start_date).toISOString().split('T')[0],
          end_date: step.end_date ? new Date(step.end_date).toISOString().split('T')[0] : null,
          note: step.note || null
        }))
      })
      
      fetchPensions()
      if (selectedPension?.id === id) {
        fetchPension(id)
      }
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to update ETF pension'
      })
      throw err
    }
  }, [put, fetchPensions, fetchPension, selectedPension])

  const updateInsurancePension = useCallback(async (id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>) => {
    try {
      await put<Pension>(getPensionApiRouteWithId(PensionType.INSURANCE, id), {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        start_date: pension.start_date.toISOString().split('T')[0],
        initial_capital: Number(pension.initial_capital),
        guaranteed_interest: Number(pension.guaranteed_interest),
        expected_return: Number(pension.expected_return)
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
  }, [put, fetchPensions, fetchPension, selectedPension])

  const updateCompanyPension = useCallback(async (id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>) => {
    try {
      await put<Pension>(getPensionApiRouteWithId(PensionType.COMPANY, id), {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        start_date: pension.start_date.toISOString().split('T')[0],
        initial_capital: Number(pension.initial_capital),
        vesting_period: Number(pension.vesting_period),
        matching_percentage: pension.matching_percentage ? Number(pension.matching_percentage) : null,
        max_employer_contribution: pension.max_employer_contribution ? Number(pension.max_employer_contribution) : null
      })
      
      fetchPensions()
      if (selectedPension?.id === id) {
        fetchPension(id)
      }
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to update company pension'
      })
      throw err
    }
  }, [put, fetchPensions, fetchPension, selectedPension])

  const getPensionStatistics = useCallback(async (pensionId: number): Promise<PensionStatistics> => {
    try {
      const pension = pensions.find(p => p.id === pensionId)
      if (!pension) {
        throw new Error('Pension not found')
      }

      const response = await get<PensionStatistics>(getPensionStatisticsRoute(pension.type, pensionId))
      return response
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to fetch pension statistics'
      })
      throw err
    }
  }, [get, pensions])

  const updatePensionStatus = useCallback(async (pensionId: number, status: PensionStatusUpdate): Promise<void> => {
    try {
      const pension = pensions.find(p => p.id === pensionId)
      if (!pension) {
        throw new Error('Pension not found')
      }

      await put(getPensionStatusRoute(pension.type, pensionId), status as unknown as Record<string, unknown>)
      
      // Create updated pension while preserving all existing data
      const updatedPension = {
        ...pension,
        status: status.status,
        paused_at: status.paused_at,
        resume_at: status.resume_at,
        // For ETF pensions, explicitly preserve ETF details
        ...(pension.type === PensionType.ETF_PLAN && {
          etf: (pension as ETFPension).etf,
          total_units: (pension as ETFPension).total_units,
          current_value: (pension as ETFPension).current_value,
          contribution_plan_steps: (pension as ETFPension).contribution_plan_steps.map(step => ({
            ...step,
            start_date: new Date(step.start_date),
            end_date: step.end_date ? new Date(step.end_date) : undefined
          }))
        })
      }
      
      setSelectedPension(updatedPension)
      setPensions(prev => prev.map(p => 
        p.id === pensionId ? updatedPension : p
      ))
      
      toast.success('Success', {
        description: `Pension ${status.status === 'PAUSED' ? 'paused' : 'resumed'} successfully`
      })
    } catch (err) {
      toast.error('Error', {
        description: `Failed to ${status.status === 'PAUSED' ? 'pause' : 'resume'} pension`
      })
      throw err
    }
  }, [put, pensions])

  const fetchPensionStatistics = useCallback(async (pensionId: number) => {
    try {
      // If already loading, don't fetch again
      if (isLoadingStatistics[pensionId]) return

      setIsLoadingStatistics(prev => ({ ...prev, [pensionId]: true }))
      
      const pension = pensions.find(p => p.id === pensionId)
      if (!pension) throw new Error('Pension not found')

      const response = await get<PensionStatistics>(getPensionStatisticsRoute(pension.type, pensionId))
      setPensionStatistics(prev => ({ ...prev, [pensionId]: response }))
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to fetch pension statistics'
      })
      throw err
    } finally {
      setIsLoadingStatistics(prev => ({ ...prev, [pensionId]: false }))
    }
  }, [get, pensions])

  return (
    <PensionContext.Provider
      value={{
        isLoading,
        error,
        pensions,
        selectedPension,
        fetchPensions,
        fetchPension,
        createEtfPension,
        createInsurancePension,
        createCompanyPension,
        updateEtfPension,
        updateInsurancePension,
        updateCompanyPension,
        deletePension,
        addOneTimeInvestment,
        realizeHistoricalContributions,
        getPensionStatistics,
        updatePensionStatus,
        pensionStatistics,
        isLoadingStatistics,
        fetchPensionStatistics,
      }}
    >
      {children}
    </PensionContext.Provider>
  )
}

export function usePension() {
  const context = useContext(PensionContext)
  if (!context) {
    throw new Error('usePension must be used within PensionProvider')
  }
  return context
} 