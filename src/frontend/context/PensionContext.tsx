"use client"

import { createContext, useContext, useState, useCallback } from 'react'
import { useApi } from '@/frontend/hooks/useApi'
import { 
  type Pension,
  type ETFPension,
  type InsurancePension,
  type CompanyPension,
  type PensionCompanyStatement,
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
import { toISODateString } from "@/frontend/lib/dateUtils"

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
  fetchPension: (id: number, pensionType?: PensionType) => Promise<void>
  createEtfPension: (pension: Omit<ETFPension, 'id' | 'current_value'>) => Promise<void>
  createInsurancePension: (pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<void>
  createCompanyPension: (pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<CompanyPension>
  createCompanyPensionWithStatement: (
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
  ) => Promise<void>
  updateEtfPension: (id: number, pension: Omit<ETFPension, 'id' | 'current_value'>) => Promise<void>
  updateInsurancePension: (id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>) => Promise<void>
  updateCompanyPension: (id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>) => Promise<void>
  updateCompanyPensionWithStatement: (
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
  ) => Promise<void>
  deletePension: (id: number) => Promise<void>
  addOneTimeInvestment: (pensionId: number, data: { 
    amount: number, 
    investment_date: string, 
    note?: string 
  }) => Promise<void>
  createContributionHistory: (pensionId: number, data: {
    amount: number,
    date: string,
    is_manual: boolean,
    note?: string
  }) => Promise<void>
  realizeHistoricalContributions: (pensionId: number) => Promise<void>
  getPensionStatistics: (pensionId: number) => Promise<PensionStatistics>
  updatePensionStatus: (pensionId: number, status: PensionStatusUpdate) => Promise<void>
  pensionStatistics: Record<number, PensionStatistics>
  isLoadingStatistics: Record<number, boolean>
  fetchPensionStatistics: (pensionId: number, pensionType?: PensionType) => Promise<void>
  createCompanyPensionStatement: (pensionId: number, data: {
    statement_date: string,
    value: number,
    note?: string,
    retirement_projections?: Array<{
      retirement_age: number,
      monthly_payout: number,
      total_capital: number
    }>
  }) => Promise<void>
  getCompanyPensionStatements: (pensionId: number) => Promise<PensionCompanyStatement[]>
  getLatestCompanyPensionStatement: (pensionId: number) => Promise<PensionCompanyStatement | null>
  getCompanyPensionStatement: (pensionId: number, statementId: number) => Promise<PensionCompanyStatement>
  updateCompanyPensionStatement: (pensionId: number, statementId: number, data: {
    statement_date: string,
    value: number,
    note?: string,
    retirement_projections?: Array<{
      retirement_age: number,
      monthly_payout: number,
      total_capital: number
    }>
  }) => Promise<void>
  deleteCompanyPensionStatement: (pensionId: number, statementId: number) => Promise<void>
}

const PensionContext = createContext<PensionContextType | undefined>(undefined)

export function usePension() {
  const context = useContext(PensionContext)
  if (context === undefined) {
    throw new Error('usePension must be used within a PensionProvider')
  }
  return context
}

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

  const fetchPension = useCallback(async (id: number, pensionType?: PensionType) => {
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
            setSelectedPension(pension);
            // Also update the pensions array
            setPensions(prev => [...prev.filter(p => p.id !== id), pension]);
            return;
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
            setSelectedPension(pension);
            // Also update the pensions array
            setPensions(prev => [...prev.filter(p => p.id !== id), pension]);
            return;
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
            setSelectedPension(pension);
            // Also update the pensions array
            setPensions(prev => [...prev.filter(p => p.id !== id), pension]);
            return;
          }
          default:
            throw new Error('Unknown pension type');
        }
      }
      
      // If no type provided, try to find the pension type from our local state first
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

  const createCompanyPension = useCallback(async (pension: Omit<CompanyPension, 'id' | 'current_value'>): Promise<CompanyPension> => {
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
  }, [post, fetchPensions])

  // Add new methods for statements
  const createCompanyPensionStatement = useCallback(async (
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
  ) => {
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
  }, [post, fetchPension, selectedPension])

  const createCompanyPensionWithStatement = useCallback(async (
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
  ) => {
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
      
      // Create pension - type is handled by the endpoint
      const createdPension = await createCompanyPension(pensionData)
      
      // Use createCompanyPensionStatement instead of direct API call
      await createCompanyPensionStatement(createdPension.id, statement)

      // Refresh pensions list
      await fetchPensions()
      
      toast.success('Success', {
        description: 'Company pension and statement created successfully'
      })
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to create company pension with statement'
      })
      throw err
    }
  }, [createCompanyPension, createCompanyPensionStatement, fetchPensions])

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

  const createContributionHistory = useCallback(async (
    pensionId: number,
    data: { amount: number, date: string, is_manual: boolean, note?: string }
  ) => {
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
      await fetchPension(pensionId)
      
      toast.success('Success', {
        description: 'Contribution has been added'
      })
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to add contribution'
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
        name: pension.name,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        notes: pension.notes,
        employer: pension.employer,
        start_date: toISODateString(pension.start_date),
        contribution_amount: pension.contribution_amount ? Number(pension.contribution_amount) : undefined,
        contribution_frequency: pension.contribution_frequency || undefined,
        status: pension.status || 'ACTIVE',
        paused_at: pension.paused_at || undefined,
        resume_at: pension.resume_at || undefined,
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: toISODateString(step.start_date),
          end_date: step.end_date ? toISODateString(step.end_date) : null,
          note: step.note || null
        }))
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

  const fetchPensionStatistics = useCallback(async (pensionId: number, pensionType?: PensionType) => {
    try {
      // If already loading, don't fetch again
      if (isLoadingStatistics[pensionId]) return

      setIsLoadingStatistics(prev => ({ ...prev, [pensionId]: true }))
      
      // If pension type is provided, use it directly
      if (pensionType) {
        const response = await get<PensionStatistics>(getPensionStatisticsRoute(pensionType, pensionId))
        setPensionStatistics(prev => ({ ...prev, [pensionId]: response }))
        return;
      }
      
      // Otherwise try to find the pension in local state
      const pension = pensions.find(p => p.id === pensionId)
      if (!pension) {
        console.warn(`Pension ${pensionId} not found in local state, cannot fetch statistics`);
        return;
      }

      const response = await get<PensionStatistics>(getPensionStatisticsRoute(pension.type, pensionId))
      setPensionStatistics(prev => ({ ...prev, [pensionId]: response }))
    } catch (err) {
      console.error('Failed to fetch pension statistics:', err);
      // Only show toast for user-visible errors, not for background fetches
      if (err instanceof Error && err.message !== 'Pension not found') {
        toast.error('Error', {
          description: 'Failed to fetch pension statistics'
        })
      }
      throw err
    } finally {
      setIsLoadingStatistics(prev => ({ ...prev, [pensionId]: false }))
    }
  }, [get, pensions])

  const getCompanyPensionStatements = useCallback(async (pensionId: number): Promise<PensionCompanyStatement[]> => {
    try {
      const response = await get<PensionCompanyStatement[]>(`${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements`)
      return response.map(statement => ({
        ...statement,
        statement_date: new Date(statement.statement_date)
      }))
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to fetch statements'
      })
      throw error
    }
  }, [get])

  const getLatestCompanyPensionStatement = useCallback(async (pensionId: number): Promise<PensionCompanyStatement | null> => {
    try {
      const response = await get<PensionCompanyStatement>(`${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements/latest`)
      return {
        ...response,
        statement_date: new Date(response.statement_date)
      }
    } catch (error: unknown) {
      // If no statements exist, return null instead of showing an error
      if (error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response && 'status' in error.response && error.response.status === 404) {
        return null
      }
      
      toast.error('Error', {
        description: 'Failed to fetch latest statement'
      })
      throw error
    }
  }, [get])

  const getCompanyPensionStatement = useCallback(async (pensionId: number, statementId: number): Promise<PensionCompanyStatement> => {
    try {
      const response = await get<PensionCompanyStatement>(`${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements/${statementId}`)
      return {
        ...response,
        statement_date: new Date(response.statement_date)
      }
    } catch (error: unknown) {
      toast.error('Error', {
        description: 'Failed to fetch statement'
      })
      throw error
    }
  }, [get])

  const updateCompanyPensionStatement = useCallback(async (
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
  ) => {
    try {
      await put(`${getPensionApiRoute(PensionType.COMPANY)}/${pensionId}/statements/${statementId}`, {
        ...data,
        statement_date: toISODateString(data.statement_date)
      })
      
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
  }, [put, fetchPension, selectedPension])

  const updateCompanyPensionWithStatement = useCallback(async (
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
  ) => {
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
        await fetchPension(id)
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
  }, [updateCompanyPension, updateCompanyPensionStatement, fetchPension, selectedPension])

  const deleteCompanyPensionStatement = useCallback(async (
    pensionId: number,
    statementId: number
  ) => {
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
  }, [del, fetchPension, selectedPension])

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
        createCompanyPensionWithStatement,
        updateEtfPension,
        updateInsurancePension,
        updateCompanyPension,
        updateCompanyPensionWithStatement,
        deletePension,
        addOneTimeInvestment,
        createContributionHistory,
        realizeHistoricalContributions,
        getPensionStatistics,
        updatePensionStatus,
        pensionStatistics,
        isLoadingStatistics,
        fetchPensionStatistics,
        getCompanyPensionStatements,
        getLatestCompanyPensionStatement,
        getCompanyPensionStatement,
        updateCompanyPensionStatement,
        createCompanyPensionStatement,
        deleteCompanyPensionStatement,
      }}
    >
      {children}
    </PensionContext.Provider>
  )
} 