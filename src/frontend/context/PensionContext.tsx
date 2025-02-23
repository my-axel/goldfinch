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
import { toast } from 'sonner'
import { 
  getPensionApiRoute, 
  getPensionApiRouteWithId,
  getPensionRealizeHistoricalRoute,
  getPensionOneTimeInvestmentRoute,
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
}

const PensionContext = createContext<PensionContextType | undefined>(undefined)

export function PensionProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, error, get, post, del, put } = useApi()
  const [pensions, setPensions] = useState<Pension[]>([])
  const [selectedPension, setSelectedPension] = useState<Pension | null>(null)

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
      // First, find the pension type from our local state
      const pension = pensions.find(p => p.id === id)
      if (!pension) {
        throw new Error('Pension not found')
      }

      // Then fetch from the appropriate endpoint
      let response: Pension
      const apiRoute = getPensionApiRouteWithId(pension.type, id)
      
      switch (pension.type) {
        case PensionType.ETF_PLAN:
          response = await get<ETFPension>(apiRoute)
          break
        case PensionType.INSURANCE:
          response = await get<InsurancePension>(apiRoute)
          break
        case PensionType.COMPANY:
          response = await get<CompanyPension>(apiRoute)
          break
        default:
          throw new Error('Unknown pension type')
      }

      setSelectedPension({
        ...response,
        contribution_plan_steps: response.contribution_plan_steps?.map(step => ({
          ...step,
          start_date: new Date(step.start_date),
          end_date: step.end_date ? new Date(step.end_date) : undefined
        })) || []
      })
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
          end_date: step.end_date ? new Date(step.end_date).toISOString().split('T')[0] : null
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

  return (
    <PensionContext.Provider value={{
      isLoading,
      error,
      pensions,
      selectedPension,
      fetchPensions,
      fetchPension,
      createEtfPension,
      createInsurancePension,
      createCompanyPension,
      deletePension,
      addOneTimeInvestment,
      updateEtfPension,
      updateInsurancePension,
      updateCompanyPension,
      realizeHistoricalContributions
    }}>
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