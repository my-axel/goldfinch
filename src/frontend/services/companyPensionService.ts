import { api } from '@/frontend/lib/api-client'
import { 
  CompanyPension, 
  PensionCompanyStatement, 
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

// Helper functions for company pension statement routes
const getCompanyPensionStatementsRoute = (pensionId: number) => {
  return `${getPensionApiRouteWithId(PensionType.COMPANY, pensionId)}/statements`
}

const getCompanyPensionStatementRoute = (pensionId: number, statementId: number) => {
  return `${getCompanyPensionStatementsRoute(pensionId)}/${statementId}`
}

/**
 * Service for interacting with company pension API endpoints
 */
export const companyPensionService = {
  /**
   * Fetch a list of all company pensions
   * @param memberId Optional member ID to filter pensions by member
   * @returns List of company pensions
   */
  async list(memberId?: number) {
    const url = new URL(getPensionApiRoute(PensionType.COMPANY), window.location.origin)
    if (memberId) {
      url.searchParams.append('member_id', memberId.toString())
    }
    return api.get<CompanyPension[]>(url.toString())
  },

  /**
   * Fetch a specific company pension by ID
   * @param id Pension ID
   * @returns Company pension details
   */
  async get(id: number) {
    return api.get<CompanyPension>(getPensionApiRouteWithId(PensionType.COMPANY, id))
  },

  /**
   * Fetch pension summaries for list views
   * @param memberId Optional member ID to filter pensions by member
   * @returns List of pension summaries
   */
  async getSummaries(memberId?: number) {
    const url = new URL(`${getPensionApiRoute(PensionType.COMPANY)}/summaries`, window.location.origin)
    if (memberId) {
      url.searchParams.append('member_id', memberId.toString())
    }
    return api.get<CompanyPension[]>(url.toString())
  },

  /**
   * Create a new company pension
   * @param pension Company pension data without ID
   * @returns Created company pension with ID
   */
  async create(pension: Omit<CompanyPension, 'id' | 'current_value'>) {
    // Format the pension data for the API exactly as in companyOperations.ts
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
    
    return api.post<CompanyPension>(
      getPensionApiRoute(PensionType.COMPANY),
      pensionData as Record<string, unknown>
    )
  },

  /**
   * Update an existing company pension
   * @param id Pension ID
   * @param pension Updated pension data
   * @returns Updated company pension
   */
  async update(id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>) {
    // Preserve exact data transformation from updateCompanyPensionOperation
    return api.put<CompanyPension>(
      getPensionApiRouteWithId(PensionType.COMPANY, id),
      {
        ...pension,
        member_id: typeof pension.member_id === 'string' ? parseInt(pension.member_id) : pension.member_id,
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
   * Delete a company pension
   * @param id Pension ID to delete
   * @returns Void promise
   */
  async delete(id: number) {
    return api.delete(getPensionApiRouteWithId(PensionType.COMPANY, id))
  },

  /**
   * Get statistics for a company pension
   * @param id Pension ID
   * @returns Pension statistics
   */
  async getStatistics(id: number) {
    return api.get<PensionStatistics>(getPensionStatisticsRoute(PensionType.COMPANY, id))
  },

  /**
   * Update the status of a company pension
   * @param id Pension ID
   * @param statusData Status update data including status and dates
   * @returns Updated company pension
   */
  async updateStatus(
    id: number,
    statusData: PensionStatusUpdate
  ) {
    return api.put<CompanyPension>(
      getPensionStatusRoute(PensionType.COMPANY, id),
      {...statusData} as unknown as Record<string, unknown>
    )
  },

  /**
   * Realize historical contributions for a company pension
   * @param id Pension ID
   * @returns Updated company pension
   */
  async realizeHistoricalContributions(id: number) {
    return api.post<CompanyPension>(
      getPensionRealizeHistoricalRoute(PensionType.COMPANY, id),
      {}
    )
  },

  /**
   * Fetch all statements for a company pension
   * @param pensionId Company pension ID
   * @returns List of statements
   */
  async getStatements(pensionId: number) {
    return api.get<PensionCompanyStatement[]>(getCompanyPensionStatementsRoute(pensionId))
  },

  /**
   * Fetch the latest statement for a company pension
   * @param pensionId Company pension ID
   * @returns Latest statement or null if none exists
   */
  async getLatestStatement(pensionId: number) {
    return api.get<PensionCompanyStatement | null>(`${getCompanyPensionStatementsRoute(pensionId)}/latest`)
  },

  /**
   * Fetch a specific statement for a company pension
   * @param pensionId Company pension ID
   * @param statementId Statement ID
   * @returns Statement details
   */
  async getStatement(pensionId: number, statementId: number) {
    return api.get<PensionCompanyStatement>(getCompanyPensionStatementRoute(pensionId, statementId))
  },

  /**
   * Create a new statement for a company pension
   * @param pensionId Company pension ID
   * @param statement Statement data without ID
   * @returns Created statement with ID
   */
  async createStatement(
    pensionId: number,
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
  ) {
    return api.post<PensionCompanyStatement>(
      getCompanyPensionStatementsRoute(pensionId),
      statement as Record<string, unknown>
    )
  },

  /**
   * Update an existing statement
   * @param pensionId Company pension ID
   * @param statementId Statement ID
   * @param statement Updated statement data
   * @returns Updated statement
   */
  async updateStatement(
    pensionId: number,
    statementId: number,
    statement: Partial<{
      statement_date: string,
      value: number,
      note?: string,
      retirement_projections?: Array<{
        retirement_age: number,
        monthly_payout: number,
        total_capital: number
      }>
    }>
  ) {
    return api.put<PensionCompanyStatement>(
      getCompanyPensionStatementRoute(pensionId, statementId),
      statement as Record<string, unknown>
    )
  },

  /**
   * Delete a statement
   * @param pensionId Company pension ID
   * @param statementId Statement ID to delete
   * @returns Void promise
   */
  async deleteStatement(pensionId: number, statementId: number) {
    return api.delete(getCompanyPensionStatementRoute(pensionId, statementId))
  },

  /**
   * Add a one-time investment to a company pension
   * @param pensionId Company pension ID
   * @param data Investment data
   * @returns Updated company pension
   */
  async addOneTimeInvestment(
    pensionId: number, 
    data: { 
      amount: number, 
      investment_date: string, 
      note?: string 
    }
  ) {
    return api.post<CompanyPension>(
      `${getPensionApiRouteWithId(PensionType.COMPANY, pensionId)}/one-time-investment`,
      data as Record<string, unknown>
    )
  },

  /**
   * Create contribution history entry for a company pension
   * @param pensionId Company pension ID
   * @param data Contribution data
   * @returns Updated company pension
   */
  async createContributionHistory(
    pensionId: number, 
    data: {
      amount: number,
      date: string,
      is_manual: boolean,
      note?: string
    }
  ) {
    return api.post<CompanyPension>(
      `${getPensionApiRouteWithId(PensionType.COMPANY, pensionId)}/contribution-history`,
      data as Record<string, unknown>
    )
  },

  /**
   * Create a company pension with statements in one operation
   * @param pension Company pension data without ID
   * @param statements Statement data array
   * @returns Created company pension with ID
   */
  async createWithStatement(
    pension: Omit<CompanyPension, 'id' | 'current_value'>, 
    statements: Record<string, unknown>[]
  ) {
    // First create the pension
    const createdPension = await this.create(pension)
    
    // Then create statements if provided
    if (statements && statements.length > 0) {
      for (const statement of statements) {
        await this.createStatement(createdPension.id, statement as {
          statement_date: string,
          value: number,
          note?: string,
          retirement_projections?: Array<{
            retirement_age: number,
            monthly_payout: number,
            total_capital: number
          }>
        })
      }
    }
    
    return createdPension
  },

  /**
   * Update a company pension with statements in one operation
   * @param id Pension ID
   * @param pension Updated pension data
   * @param statements Updated statement data array
   * @returns Updated company pension
   */
  async updateWithStatement(
    id: number, 
    pension: Omit<CompanyPension, 'id' | 'current_value'>, 
    statements: Record<string, unknown>[]
  ) {
    // First update the pension
    const updatedPension = await this.update(id, pension)
    
    // Then update/create statements if provided
    if (statements && statements.length > 0) {
      for (const statement of statements) {
        const statementId = (statement as { id?: number }).id
        
        if (statementId) {
          // Update existing statement
          await this.updateStatement(id, statementId, statement as {
            statement_date: string,
            value: number,
            note?: string,
            retirement_projections?: Array<{
              retirement_age: number,
              monthly_payout: number,
              total_capital: number
            }>
          })
        } else {
          // Create new statement
          await this.createStatement(id, statement as {
            statement_date: string,
            value: number,
            note?: string,
            retirement_projections?: Array<{
              retirement_age: number,
              monthly_payout: number,
              total_capital: number
            }>
          })
        }
      }
    }
    
    return updatedPension
  }
} 