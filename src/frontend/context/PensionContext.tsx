"use client"

import { createContext, useContext, useState, useCallback } from 'react'
import { useApi } from '@/frontend/hooks/useApi'
import { 
  type Pension,
  type ETFPension,
  type InsurancePension,
  type CompanyPension,
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
  createEtfPension: (pension: Omit<ETFPension, 'id' | 'contribution_plan' | 'current_value'>) => Promise<void>
  createInsurancePension: (pension: Omit<InsurancePension, 'id' | 'contribution_plan' | 'current_value'>) => Promise<void>
  createCompanyPension: (pension: Omit<CompanyPension, 'id' | 'contribution_plan' | 'current_value'>) => Promise<void>
  updateEtfPension: (id: number, pension: Omit<ETFPension, 'id' | 'contribution_plan' | 'current_value'>) => Promise<void>
  updateInsurancePension: (id: number, pension: Omit<InsurancePension, 'id' | 'contribution_plan' | 'current_value'>) => Promise<void>
  updateCompanyPension: (id: number, pension: Omit<CompanyPension, 'id' | 'contribution_plan' | 'current_value'>) => Promise<void>
  deletePension: (id: number) => Promise<void>
  fetchContributions: (pensionId: number) => Promise<void>
  addContribution: (pensionId: number, contribution: Omit<PensionContribution, 'id' | 'pension_id'>) => Promise<void>
}

const PensionContext = createContext<PensionContextType | undefined>(undefined)

export function PensionProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, error, get, post, del, put } = useApi()
  const [pensions, setPensions] = useState<Pension[]>([])
  const [selectedPension, setSelectedPension] = useState<Pension | null>(null)
  const [contributions, setContributions] = useState<PensionContribution[]>([])

  const fetchPensions = useCallback(async (memberId?: number) => {
    const url = memberId ? `/api/v1/pension?member_id=${memberId}` : '/api/v1/pension'
    const response = await get<Pension[]>(url)
    setPensions(response.map(p => ({
      ...p,
      start_date: new Date(p.start_date)
    })))
  }, [get])

  const fetchPension = useCallback(async (id: number) => {
    const response = await get<Pension>(`/api/v1/pension/${id}`)
    setSelectedPension({
      ...response,
      start_date: new Date(response.start_date)
    })
  }, [get])

  const createEtfPension = useCallback(async (pension: Omit<ETFPension, 'id' | 'contribution_plan' | 'current_value'>) => {
    try {
      // Send all data to backend and let it handle ETF creation if needed
      await post<Pension>('/api/v1/pension/etf', {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        start_date: pension.start_date.toISOString().split('T')[0],
        initial_capital: Number(pension.initial_capital),
        current_value: Number(pension.initial_capital)
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

  const createInsurancePension = useCallback(async (pension: Omit<InsurancePension, 'id' | 'contribution_plan' | 'current_value'>) => {
    await post<Pension>('/api/v1/pension/insurance', {
      ...pension,
      start_date: pension.start_date.toISOString()
    } as Record<string, unknown>)
    fetchPensions()
  }, [post, fetchPensions])

  const createCompanyPension = useCallback(async (pension: Omit<CompanyPension, 'id' | 'contribution_plan' | 'current_value'>) => {
    await post<Pension>('/api/v1/pension/company', {
      ...pension,
      start_date: pension.start_date.toISOString()
    } as Record<string, unknown>)
    fetchPensions()
  }, [post, fetchPensions])

  const deletePension = useCallback(async (id: number) => {
    await del(`/api/v1/pension/${id}`)
    fetchPensions()
    if (selectedPension?.id === id) {
      setSelectedPension(null)
    }
  }, [del, fetchPensions, selectedPension])

  const fetchContributions = useCallback(async (pensionId: number) => {
    const response = await get<PensionContribution[]>(`/api/v1/pension/${pensionId}/contributions`)
    setContributions(response)
  }, [get])

  const addContribution = useCallback(async (pensionId: number, contribution: Omit<PensionContribution, 'id' | 'pension_id'>) => {
    await post<PensionContribution>(`/api/v1/pension/${pensionId}/contributions`, contribution as Record<string, unknown>)
    fetchContributions(pensionId)
  }, [post, fetchContributions])

  const updateEtfPension = useCallback(async (id: number, pension: Omit<ETFPension, 'id' | 'contribution_plan' | 'current_value'>) => {
    try {
      await put<Pension>(`/api/v1/pension/etf/${id}`, {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        start_date: pension.start_date.toISOString().split('T')[0],
        initial_capital: Number(pension.initial_capital)
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

  const updateInsurancePension = useCallback(async (id: number, pension: Omit<InsurancePension, 'id' | 'contribution_plan' | 'current_value'>) => {
    try {
      await put<Pension>(`/api/v1/pension/insurance/${id}`, {
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

  const updateCompanyPension = useCallback(async (id: number, pension: Omit<CompanyPension, 'id' | 'contribution_plan' | 'current_value'>) => {
    try {
      await put<Pension>(`/api/v1/pension/company/${id}`, {
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
      addContribution,
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