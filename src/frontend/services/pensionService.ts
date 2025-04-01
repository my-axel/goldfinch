import { api } from '@/frontend/lib/api-client'
import { 
  PensionType, 
  PensionStatusUpdate,
  ETFPensionList,
  InsurancePensionList,
  CompanyPensionList,
  StatePensionList,
  SavingsPensionList
} from '@/frontend/types/pension'
import { 
  getPensionApiRouteWithId, 
  getPensionStatusRoute 
} from '@/frontend/lib/routes/api/pension'

/**
 * Combined service for interacting with pension API endpoints across all pension types
 */
export const pensionService = {
  /**
   * Fetch all pension summaries across all pension types
   * @param memberId Optional member ID to filter pensions by member
   * @returns List of all pension summaries
   */
  async getAllPensions(memberId?: number) {
    const queryParam = memberId ? `?member_id=${memberId}` : ''
    
    const [etfResponse, insuranceResponse, companyResponse, stateResponse, savingsResponse] = await Promise.all([
      api.get<ETFPensionList[]>(`/api/v1/pension-summaries/etf${queryParam}`),
      api.get<InsurancePensionList[]>(`/api/v1/pension-summaries/insurance${queryParam}`),
      api.get<CompanyPensionList[]>(`/api/v1/pension-summaries/company${queryParam}`),
      api.get<StatePensionList[]>(`/api/v1/pension-summaries/state${queryParam}`),
      api.get<SavingsPensionList[]>(`/api/v1/pension-summaries/savings${queryParam}`)
    ])

    // Process ETF pensions
    const etfPensions = etfResponse.map(p => ({
      ...p,
      type: PensionType.ETF_PLAN as const,
      // Convert dates if needed
      paused_at: p.paused_at ? new Date(p.paused_at) : undefined,
      resume_at: p.resume_at ? new Date(p.resume_at) : undefined
    }))

    // Process Insurance pensions
    const insurancePensions = insuranceResponse.map(p => ({
      ...p,
      type: PensionType.INSURANCE as const,
      start_date: new Date(p.start_date),
      paused_at: p.paused_at ? new Date(p.paused_at) : undefined,
      resume_at: p.resume_at ? new Date(p.resume_at) : undefined
    }))

    // Process Company pensions
    const companyPensions = companyResponse.map(p => ({
      ...p,
      type: PensionType.COMPANY as const,
      start_date: new Date(p.start_date),
      paused_at: p.paused_at ? new Date(p.paused_at) : undefined,
      resume_at: p.resume_at ? new Date(p.resume_at) : undefined,
      latest_statement_date: p.latest_statement_date ? new Date(p.latest_statement_date) : undefined
    }))

    // Process State pensions
    const statePensions = stateResponse.map(p => ({
      ...p,
      type: PensionType.STATE as const,
      start_date: new Date(p.start_date),
      paused_at: p.paused_at ? new Date(p.paused_at) : undefined,
      resume_at: p.resume_at ? new Date(p.resume_at) : undefined,
      latest_statement_date: p.latest_statement_date ? new Date(p.latest_statement_date) : undefined
    }))
    
    // Process Savings pensions
    const savingsPensions = savingsResponse.map(p => ({
      ...p,
      type: PensionType.SAVINGS as const,
      paused_at: p.paused_at ? new Date(p.paused_at) : undefined,
      resume_at: p.resume_at ? new Date(p.resume_at) : undefined,
      latest_statement_date: p.latest_statement_date ? new Date(p.latest_statement_date) : undefined
    }))

    // Combine all pensions
    return [
      ...etfPensions,
      ...insurancePensions,
      ...companyPensions,
      ...statePensions,
      ...savingsPensions
    ]
  },

  /**
   * Delete a pension of any type
   * @param id Pension ID to delete
   * @param pensionType Type of pension
   * @returns Void promise
   */
  async deletePension(id: number, pensionType: PensionType) {
    return api.delete(getPensionApiRouteWithId(pensionType, id))
  },

  /**
   * Update the status of a pension of any type
   * @param id Pension ID
   * @param pensionType Type of pension
   * @param statusData Status update data
   * @returns Updated pension data
   */
  async updatePensionStatus(
    id: number,
    pensionType: PensionType,
    statusData: PensionStatusUpdate
  ) {
    return api.put(
      getPensionStatusRoute(pensionType, id),
      {...statusData} as unknown as Record<string, unknown>
    )
  }
} 