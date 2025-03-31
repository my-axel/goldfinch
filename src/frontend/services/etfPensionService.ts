import { api } from '@/frontend/lib/api-client'
import { ETFPension, PensionType, PensionStatusUpdate } from '@/frontend/types/pension'
import { PensionStatistics } from '@/frontend/types/pension-statistics'
import { 
  getPensionApiRoute,
  getPensionApiRouteWithId,
  getPensionRealizeHistoricalRoute,
  getPensionStatisticsRoute,
  getPensionStatusRoute
} from '@/frontend/lib/routes/api/pension'
import { toISODateString } from '@/frontend/lib/dateUtils'

/**
 * Service for interacting with ETF pension API endpoints
 */
export const etfPensionService = {
  /**
   * Fetch a list of all ETF pensions
   * @param memberId Optional member ID to filter pensions by member
   * @returns List of ETF pensions
   */
  async list(memberId?: number) {
    const url = new URL(getPensionApiRoute(PensionType.ETF_PLAN), window.location.origin)
    if (memberId) {
      url.searchParams.append('member_id', memberId.toString())
    }
    return api.get<ETFPension[]>(url.toString())
  },

  /**
   * Fetch pension summaries for list views
   * @param memberId Optional member ID to filter pensions by member
   * @returns List of pension summaries
   */
  async getSummaries(memberId?: number) {
    const url = new URL(`${getPensionApiRoute(PensionType.ETF_PLAN)}/summaries`, window.location.origin)
    if (memberId) {
      url.searchParams.append('member_id', memberId.toString())
    }
    return api.get<ETFPension[]>(url.toString())
  },

  /**
   * Fetch a specific ETF pension by ID
   * @param id Pension ID
   * @returns ETF pension details
   */
  async get(id: number) {
    return api.get<ETFPension>(getPensionApiRouteWithId(PensionType.ETF_PLAN, id))
  },

  /**
   * Create a new ETF pension
   * @param pension ETF pension data without ID
   * @returns Created ETF pension with ID
   */
  async create(pension: Omit<ETFPension, 'id' | 'current_value'>) {
    const formattedPension = {
      ...pension,
      member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
      reference_date: pension.reference_date ? toISODateString(pension.reference_date) : undefined,
      contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
        amount: Number(step.amount),
        frequency: step.frequency,
        start_date: toISODateString(step.start_date),
        end_date: step.end_date ? toISODateString(step.end_date) : null,
        note: step.note || null
      }))
    }
    
    return api.post<ETFPension>(
      getPensionApiRoute(PensionType.ETF_PLAN),
      formattedPension as Record<string, unknown>
    )
  },

  /**
   * Update an existing ETF pension
   * @param id Pension ID
   * @param pension Updated pension data
   * @returns Updated ETF pension
   */
  async update(id: number, pension: Omit<ETFPension, 'id' | 'current_value'>) {
    const formattedPension = {
      ...pension,
      member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
      reference_date: pension.reference_date ? toISODateString(pension.reference_date) : undefined,
      contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
        id: step.id,
        amount: Number(step.amount),
        frequency: step.frequency,
        start_date: toISODateString(step.start_date),
        end_date: step.end_date ? toISODateString(step.end_date) : null,
        note: step.note || null
      }))
    }
    
    return api.put<ETFPension>(
      getPensionApiRouteWithId(PensionType.ETF_PLAN, id),
      formattedPension as Record<string, unknown>
    )
  },

  /**
   * Delete an ETF pension
   * @param id Pension ID to delete
   * @returns Void promise
   */
  async delete(id: number) {
    return api.delete(getPensionApiRouteWithId(PensionType.ETF_PLAN, id))
  },

  /**
   * Get statistics for an ETF pension
   * @param id Pension ID
   * @returns Pension statistics
   */
  async getStatistics(id: number) {
    return api.get<PensionStatistics>(getPensionStatisticsRoute(PensionType.ETF_PLAN, id))
  },

  /**
   * Update the status of an ETF pension
   * @param id Pension ID
   * @param statusData Status update data including status and dates
   * @returns Updated ETF pension
   */
  async updateStatus(
    id: number,
    statusData: PensionStatusUpdate
  ) {
    return api.put<ETFPension>(
      getPensionStatusRoute(PensionType.ETF_PLAN, id),
      {...statusData} as unknown as Record<string, unknown>
    )
  },

  /**
   * Realize historical contributions for an ETF pension
   * @param id Pension ID
   * @returns Updated ETF pension
   */
  async realizeHistoricalContributions(id: number) {
    return api.post<ETFPension>(
      getPensionRealizeHistoricalRoute(PensionType.ETF_PLAN, id),
      {}
    )
  },

  /**
   * Add a one-time investment to an ETF pension
   * @param pensionId ETF pension ID
   * @param data Investment data
   * @returns Updated ETF pension
   */
  async addOneTimeInvestment(
    pensionId: number, 
    data: { 
      amount: number, 
      investment_date: string, 
      note?: string 
    }
  ) {
    return api.post<ETFPension>(
      `${getPensionApiRouteWithId(PensionType.ETF_PLAN, pensionId)}/one-time-investment`,
      data as Record<string, unknown>
    )
  }
} 