import { api } from '@/frontend/lib/api-client'
import { 
  InsurancePension, 
  InsurancePensionStatement, 
  PensionType, 
  PensionStatusUpdate 
} from '@/frontend/types/pension'
import { PensionStatistics } from '@/frontend/types/pension-statistics'
import { 
  getPensionApiRoute,
  getPensionApiRouteWithId,
  getPensionRealizeHistoricalRoute,
  getPensionStatisticsRoute,
  getPensionStatusRoute
} from '@/frontend/lib/routes/api/pension'
import { toISODateString } from '@/frontend/lib/dateUtils'

// Helper functions for insurance pension statement routes
const getInsurancePensionStatementsRoute = (pensionId: number) => {
  return `${getPensionApiRouteWithId(PensionType.INSURANCE, pensionId)}/statements`
}

const getInsurancePensionStatementRoute = (pensionId: number, statementId: number) => {
  return `${getInsurancePensionStatementsRoute(pensionId)}/${statementId}`
}

/**
 * Service for interacting with insurance pension API endpoints
 */
export const insurancePensionService = {
  /**
   * Fetch a list of all insurance pensions
   * @param memberId Optional member ID to filter pensions by member
   * @returns List of insurance pensions
   */
  async list(memberId?: number) {
    const url = new URL(getPensionApiRoute(PensionType.INSURANCE), window.location.origin)
    if (memberId) {
      url.searchParams.append('member_id', memberId.toString())
    }
    return api.get<InsurancePension[]>(url.toString())
  },

  /**
   * Fetch a specific insurance pension by ID
   * @param id Pension ID
   * @returns Insurance pension details
   */
  async get(id: number) {
    return api.get<InsurancePension>(getPensionApiRouteWithId(PensionType.INSURANCE, id))
  },

  /**
   * Fetch pension summaries for list views
   * @param memberId Optional member ID to filter pensions by member
   * @returns List of pension summaries
   */
  async getSummaries(memberId?: number) {
    const url = new URL(`${getPensionApiRoute(PensionType.INSURANCE)}/summaries`, window.location.origin)
    if (memberId) {
      url.searchParams.append('member_id', memberId.toString())
    }
    return api.get<InsurancePension[]>(url.toString())
  },

  /**
   * Create a new insurance pension
   * @param pension Insurance pension data without ID
   * @returns Created insurance pension with ID
   */
  async create(pension: Omit<InsurancePension, 'id' | 'current_value'>) {
    // Format the pension data for the API
    const pensionData = {
      ...pension,
      member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
      start_date: toISODateString(pension.start_date),
      guaranteed_interest: pension.guaranteed_interest !== undefined ? Number(pension.guaranteed_interest) : undefined,
      expected_return: pension.expected_return !== undefined ? Number(pension.expected_return) : undefined,
      contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
        amount: Number(step.amount),
        frequency: step.frequency,
        start_date: toISODateString(step.start_date),
        end_date: step.end_date ? toISODateString(step.end_date) : null,
        note: step.note || null
      }))
    } as const
    
    return api.post<InsurancePension>(
      getPensionApiRoute(PensionType.INSURANCE),
      pensionData as Record<string, unknown>
    )
  },

  /**
   * Update an existing insurance pension
   * @param id Pension ID
   * @param pension Updated pension data
   * @returns Updated insurance pension
   */
  async update(id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>) {
    // Format the update data
    return api.put<InsurancePension>(
      getPensionApiRouteWithId(PensionType.INSURANCE, id),
      {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
        start_date: toISODateString(pension.start_date),
        guaranteed_interest: pension.guaranteed_interest !== undefined ? Number(pension.guaranteed_interest) : undefined,
        expected_return: pension.expected_return !== undefined ? Number(pension.expected_return) : undefined,
        contribution_plan_steps: (pension.contribution_plan_steps || []).map(step => ({
          id: step.id,
          amount: Number(step.amount),
          frequency: step.frequency,
          start_date: toISODateString(step.start_date),
          end_date: step.end_date ? toISODateString(step.end_date) : null,
          note: step.note || null
        }))
      } as Record<string, unknown>
    )
  },

  /**
   * Delete an insurance pension
   * @param id Pension ID to delete
   * @returns Void promise
   */
  async delete(id: number) {
    return api.delete(getPensionApiRouteWithId(PensionType.INSURANCE, id))
  },

  /**
   * Get statistics for an insurance pension
   * @param id Pension ID
   * @returns Pension statistics
   */
  async getStatistics(id: number) {
    return api.get<PensionStatistics>(getPensionStatisticsRoute(PensionType.INSURANCE, id))
  },

  /**
   * Update the status of an insurance pension
   * @param id Pension ID
   * @param statusData Status update data including status and dates
   * @returns Updated insurance pension
   */
  async updateStatus(
    id: number,
    statusData: PensionStatusUpdate
  ) {
    return api.put<InsurancePension>(
      getPensionStatusRoute(PensionType.INSURANCE, id),
      {...statusData} as unknown as Record<string, unknown>
    )
  },

  /**
   * Realize historical contributions for an insurance pension
   * @param id Pension ID
   * @returns Updated insurance pension
   */
  async realizeHistoricalContributions(id: number) {
    return api.post<InsurancePension>(
      getPensionRealizeHistoricalRoute(PensionType.INSURANCE, id),
      {}
    )
  },

  /**
   * Fetch all statements for an insurance pension
   * @param pensionId Insurance pension ID
   * @returns List of statements
   */
  async getStatements(pensionId: number) {
    return api.get<InsurancePensionStatement[]>(getInsurancePensionStatementsRoute(pensionId))
  },

  /**
   * Fetch the latest statement for an insurance pension
   * @param pensionId Insurance pension ID
   * @returns Latest statement or null if none exists
   */
  async getLatestStatement(pensionId: number) {
    return api.get<InsurancePensionStatement | null>(`${getInsurancePensionStatementsRoute(pensionId)}/latest`)
  },

  /**
   * Fetch a specific statement for an insurance pension
   * @param pensionId Insurance pension ID
   * @param statementId Statement ID
   * @returns Statement details
   */
  async getStatement(pensionId: number, statementId: number) {
    return api.get<InsurancePensionStatement>(getInsurancePensionStatementRoute(pensionId, statementId))
  },

  /**
   * Create a new statement for an insurance pension
   * @param pensionId Insurance pension ID
   * @param statement Statement data without ID
   * @returns Created statement with ID
   */
  async createStatement(
    pensionId: number,
    statement: {
      statement_date: string,
      value: number,
      total_contributions: number,
      total_benefits: number,
      costs_amount: number,
      costs_percentage: number,
      note?: string,
      projections?: Array<{
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
      }>
    }
  ) {
    return api.post<InsurancePensionStatement>(
      getInsurancePensionStatementsRoute(pensionId),
      statement as Record<string, unknown>
    )
  },

  /**
   * Update an existing statement
   * @param pensionId Insurance pension ID
   * @param statementId Statement ID
   * @param statement Updated statement data
   * @returns Updated statement
   */
  async updateStatement(
    pensionId: number,
    statementId: number,
    statement: {
      statement_date: string,
      value: number,
      total_contributions: number,
      total_benefits: number,
      costs_amount: number,
      costs_percentage: number,
      note?: string,
      projections?: Array<{
        scenario_type: 'with_contributions' | 'without_contributions',
        return_rate: number,
        value_at_retirement: number,
        monthly_payout: number
      }>
    }
  ) {
    return api.put<InsurancePensionStatement>(
      getInsurancePensionStatementRoute(pensionId, statementId),
      statement as Record<string, unknown>
    )
  },

  /**
   * Delete a statement
   * @param pensionId Insurance pension ID
   * @param statementId Statement ID to delete
   * @returns Void promise
   */
  async deleteStatement(pensionId: number, statementId: number) {
    return api.delete(getInsurancePensionStatementRoute(pensionId, statementId))
  },

  /**
   * Add a one-time investment to an insurance pension
   * @param pensionId Insurance pension ID
   * @param data Investment data
   * @returns Updated insurance pension
   */
  async addOneTimeInvestment(
    pensionId: number, 
    data: { 
      amount: number, 
      investment_date: string, 
      note?: string 
    }
  ) {
    return api.post<InsurancePension>(
      `${getPensionApiRouteWithId(PensionType.INSURANCE, pensionId)}/one-time-investment`,
      data as Record<string, unknown>
    )
  }
} 