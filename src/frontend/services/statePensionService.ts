import { api } from '@/frontend/lib/api-client'
import { StatePension, StatePensionStatement, StatePensionProjection, PensionType, PensionStatusUpdate } from '@/frontend/types/pension'
import { 
  getPensionApiRoute,
  getPensionApiRouteWithId,
  getStatePensionStatementsRoute,
  getStatePensionStatementRoute,
  getStatePensionScenariosRoute,
  getStatePensionSummariesRoute,
  getPensionStatusRoute
} from '@/frontend/lib/routes/api/pension'

/**
 * Service for interacting with state pension API endpoints
 */
export const statePensionService = {
  /**
   * Fetch a list of all state pensions
   * @param memberId Optional member ID to filter pensions by member
   * @returns List of state pensions
   */
  async list(memberId?: number) {
    const url = new URL(getPensionApiRoute(PensionType.STATE), window.location.origin)
    if (memberId) {
      url.searchParams.append('member_id', memberId.toString())
    }
    return api.get<StatePension[]>(url.toString())
  },

  /**
   * Fetch a specific state pension by ID
   * @param id Pension ID
   * @returns State pension details
   */
  async get(id: number) {
    return api.get<StatePension>(getPensionApiRouteWithId(PensionType.STATE, id))
  },

  /**
   * Create a new state pension
   * @param pension State pension data without ID
   * @returns Created state pension with ID
   */
  async create(pension: Omit<StatePension, 'id'>) {
    return api.post<StatePension>(
      getPensionApiRoute(PensionType.STATE),
      pension as Record<string, unknown>
    )
  },

  /**
   * Update an existing state pension
   * @param id Pension ID
   * @param pension Updated pension data
   * @returns Updated state pension
   */
  async update(id: number, pension: Partial<Omit<StatePension, 'id'>>) {
    return api.put<StatePension>(
      getPensionApiRouteWithId(PensionType.STATE, id),
      pension as Record<string, unknown>
    )
  },

  /**
   * Delete a state pension
   * @param id Pension ID to delete
   * @returns Void promise
   */
  async delete(id: number) {
    return api.delete(getPensionApiRouteWithId(PensionType.STATE, id))
  },

  /**
   * Fetch all statements for a state pension
   * @param pensionId State pension ID
   * @returns List of statements
   */
  async getStatements(pensionId: number) {
    return api.get<StatePensionStatement[]>(getStatePensionStatementsRoute(pensionId))
  },

  /**
   * Create a new statement for a state pension
   * @param pensionId State pension ID
   * @param statement Statement data without ID
   * @returns Created statement with ID
   */
  async createStatement(
    pensionId: number,
    statement: Omit<StatePensionStatement, 'id' | 'pension_id'>
  ) {
    return api.post<StatePensionStatement>(
      getStatePensionStatementsRoute(pensionId),
      statement as Record<string, unknown>
    )
  },

  /**
   * Update an existing statement
   * @param pensionId State pension ID
   * @param statementId Statement ID
   * @param statement Updated statement data
   * @returns Updated statement
   */
  async updateStatement(
    pensionId: number,
    statementId: number,
    statement: Partial<Omit<StatePensionStatement, 'id' | 'pension_id'>>
  ) {
    return api.put<StatePensionStatement>(
      getStatePensionStatementRoute(pensionId, statementId),
      statement as Record<string, unknown>
    )
  },

  /**
   * Delete a statement
   * @param pensionId State pension ID
   * @param statementId Statement ID to delete
   * @returns Void promise
   */
  async deleteStatement(pensionId: number, statementId: number) {
    return api.delete(getStatePensionStatementRoute(pensionId, statementId))
  },

  /**
   * Get projection scenarios for a state pension
   * @param pensionId State pension ID
   * @returns Projection scenarios
   */
  async getScenarios(pensionId: number) {
    return api.get<StatePensionProjection>(getStatePensionScenariosRoute(pensionId))
  },

  /**
   * Get lightweight pension summaries for list views
   * @param memberId Optional member ID to filter pensions by member
   * @returns List of state pension summaries
   */
  async getSummaries(memberId?: number) {
    const url = new URL(getStatePensionSummariesRoute(), window.location.origin)
    if (memberId) {
      url.searchParams.append('member_id', memberId.toString())
    }
    return api.get<StatePension[]>(url.toString())
  },

  /**
   * Update the status of a state pension
   * @param pensionId State pension ID
   * @param statusData Status update data including status and dates
   * @returns Updated state pension
   */
  async updateStatus(
    pensionId: number,
    statusData: PensionStatusUpdate
  ) {
    return api.put<StatePension>(
      getPensionStatusRoute(PensionType.STATE, pensionId),
      {...statusData} as unknown as Record<string, unknown>
    )
  }
} 