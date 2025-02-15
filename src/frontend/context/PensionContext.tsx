"use client"

import { createContext, useContext, useState, useCallback } from 'react'
import { useApi } from '@/frontend/hooks/useApi'
import { 
  type Pension,
  type ETFPension,
  type InsurancePension,
  type CompanyPension,
  type ContributionStep,
  PensionType
} from '@/frontend/types/pension'
import { toast } from 'sonner'

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
  contributions: PensionContribution[]
  fetchPensions: (memberId?: number) => Promise<void>
  fetchPension: (id: number) => Promise<void>
  createEtfPension: (pension: Omit<ETFPension, 'id' | 'current_value'>) => Promise<void>
  createInsurancePension: (pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<void>
  createCompanyPension: (pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<void>
  updateEtfPension: (id: number, pension: Omit<ETFPension, 'id' | 'current_value'>) => Promise<void>
  updateInsurancePension: (id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<void>
  updateCompanyPension: (id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<void>
  deletePension: (id: number) => Promise<void>
  fetchContributions: (pensionId: number) => Promise<void>
  addOneTimeInvestment: (pensionId: number, data: { 
    amount: number, 
    investment_date: string, 
    note?: string 
  }) => Promise<void>
}

const PensionContext = createContext<PensionContextType | undefined>(undefined)

export function PensionProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, error, get, post, del, put } = useApi()
  const [pensions, setPensions] = useState<Pension[]>([])
  const [selectedPension, setSelectedPension] = useState<Pension | null>(null)
  const [contributions, setContributions] = useState<PensionContribution[]>([])

  const fetchPensions = useCallback(async (memberId?: number) => {
    const url = memberId ? `/pension?member_id=${memberId}` : '/pension'
    const response = await get<Pension[]>(url)
    setPensions(response.map(p => ({
      ...p,
      start_date: new Date(p.start_date),
      ...(p.type === PensionType.ETF_PLAN && {
        contribution_plan: (p as ETFPension).contribution_plan?.map((step: ContributionStep) => ({
          ...step,
          start_date: new Date(step.start_date),
          end_date: step.end_date ? new Date(step.end_date) : undefined
        })) || []
      })
    })))
  }, [get])

  const fetchPension = useCallback(async (id: number) => {
    const response = await get<Pension>(`/pension/${id}`)
    setSelectedPension({
      ...response,
      start_date: new Date(response.start_date),
      ...(response.type === PensionType.ETF_PLAN && {
        contribution_plan: (response as ETFPension).contribution_plan?.map((step: ContributionStep) => ({
          ...step,
          start_date: new Date(step.start_date),
          end_date: step.end_date ? new Date(step.end_date) : undefined
        })) || []
      })
    })
  }, [get])

  const createEtfPension = useCallback(async (pension: Omit<ETFPension, 'id' | 'current_value'>) => {
    try {
      // Send all data to backend and let it handle ETF creation if needed
      await post<Pension>('/pension/etf', {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        start_date: pension.start_date.toISOString().split('T')[0],
        initial_capital: Number(pension.initial_capital),
        current_value: Number(pension.initial_capital),
        contribution_plan: (pension.contribution_plan || []).map((step: ContributionStep) => ({
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: step.start_date.toISOString().split('T')[0],
          end_date: step.end_date ? step.end_date.toISOString().split('T')[0] : null
        }))
      })
      
      fetchPensions()
    } catch (err) {
      console.error('Failed to create ETF pension:', err)
      toast.error('Error', {
        description: 'Failed to create ETF pension'
      })
      throw err
    }
  }, [post, fetchPensions])

  const createInsurancePension = useCallback(async (pension: Omit<InsurancePension, 'id' | 'current_value'>) => {
    await post<Pension>('/pension/insurance', {
      ...pension,
      start_date: pension.start_date.toISOString()
    } as Record<string, unknown>)
    fetchPensions()
  }, [post, fetchPensions])

  const createCompanyPension = useCallback(async (pension: Omit<CompanyPension, 'id' | 'current_value'>) => {
    await post<Pension>('/pension/company', {
      ...pension,
      start_date: pension.start_date.toISOString()
    } as Record<string, unknown>)
    fetchPensions()
  }, [post, fetchPensions])

  const deletePension = useCallback(async (id: number) => {
    await del(`/pension/${id}`)
    fetchPensions()
    if (selectedPension?.id === id) {
      setSelectedPension(null)
    }
  }, [del, fetchPensions, selectedPension])

  const fetchContributions = useCallback(async (pensionId: number) => {
    const response = await get<PensionContribution[]>(`/pension/${pensionId}/contributions`)
    setContributions(response)
  }, [get])

  const addOneTimeInvestment = useCallback(async (
    pensionId: number,
    data: { amount: number, investment_date: string, note?: string }
  ) => {
    try {
      await post(`/pension/${pensionId}/one-time-investment`, {
        amount: data.amount,
        investment_date: data.investment_date,
        note: data.note || undefined
      })
      await fetchPension(pensionId)
      await fetchContributions(pensionId)
    } catch (err) {
      console.error('Failed to add one-time investment:', err)
      toast.error('Error', {
        description: 'Failed to add one-time investment'
      })
      throw err
    }
  }, [post, fetchPension, fetchContributions])

  const updateEtfPension = useCallback(async (id: number, pension: Omit<ETFPension, 'id' | 'current_value'>) => {
    try {
      await put<Pension>(`/pension/etf/${id}`, {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        start_date: new Date(pension.start_date).toISOString().split('T')[0],
        initial_capital: Number(pension.initial_capital),
        contribution_plan: (pension.contribution_plan || []).map((step: ContributionStep) => ({
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
      console.error('Failed to update ETF pension:', err)
      toast.error('Error', {
        description: 'Failed to update ETF pension'
      })
      throw err
    }
  }, [put, fetchPensions, fetchPension, selectedPension])

  const updateInsurancePension = useCallback(async (id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>) => {
    try {
      await put<Pension>(`/pension/insurance/${id}`, {
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
      console.error('Failed to update insurance pension:', err)
      toast.error('Error', {
        description: 'Failed to update insurance pension'
      })
      throw err
    }
  }, [put, fetchPensions, fetchPension, selectedPension])

  const updateCompanyPension = useCallback(async (id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>) => {
    try {
      await put<Pension>(`/pension/company/${id}`, {
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
      console.error('Failed to update company pension:', err)
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
      contributions,
      fetchPensions,
      fetchPension,
      createEtfPension,
      createInsurancePension,
      createCompanyPension,
      deletePension,
      fetchContributions,
      addOneTimeInvestment,
      updateEtfPension,
      updateInsurancePension,
      updateCompanyPension,
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