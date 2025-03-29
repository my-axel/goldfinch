import { api } from '@/frontend/lib/api-client'
import { ETF, ETFUpdateStatus, ETFMetrics, YFinanceETF } from '@/frontend/types/etf'
import { 
  getETFApiRoute, 
  getETFByIdRoute, 
  getETFSearchRoute, 
  getETFUpdateRoute, 
  getETFStatusRoute, 
  getETFMetricsRoute 
} from '@/frontend/lib/routes/api/etf'

/**
 * Service for interacting with ETF API endpoints
 */
export const etfService = {
  /**
   * Fetch a list of all ETFs
   * @returns List of ETFs
   */
  async list() {
    return api.get<ETF[]>(getETFApiRoute())
  },

  /**
   * Search for ETFs using a query string
   * @param query Search term for filtering ETFs
   * @returns List of ETFs matching the query
   */
  async search(query: string) {
    return api.get<ETF[]>(getETFSearchRoute(query))
  },

  /**
   * Search for ETFs using YFinance
   * @param query Search term for searching ETFs
   * @returns List of ETFs from YFinance
   */
  async searchYFinance(query: string) {
    return api.get<YFinanceETF[]>(`/api/v1/etf/search?query=${encodeURIComponent(query)}`)
  },

  /**
   * Get a specific ETF by ID
   * @param id ETF ID
   * @returns ETF details
   */
  async get(id: string) {
    return api.get<ETF>(getETFByIdRoute(id))
  },

  /**
   * Create a new ETF
   * @param etf ETF data without ID
   * @returns Created ETF with ID
   */
  async create(etf: Omit<ETF, 'id'>) {
    return api.post<ETF>(getETFApiRoute(), etf as Record<string, unknown>)
  },

  /**
   * Update an existing ETF
   * @param id ETF ID
   * @param etf Updated ETF data
   * @returns Updated ETF
   */
  async update(id: string, etf: Partial<ETF>) {
    return api.put<ETF>(getETFByIdRoute(id), etf as Record<string, unknown>)
  },

  /**
   * Delete an ETF
   * @param id ETF ID to delete
   * @returns Void promise
   */
  async delete(id: string) {
    return api.delete(getETFByIdRoute(id))
  },

  /**
   * Trigger an ETF data update
   * @param id ETF ID
   * @param type Update type ('full', 'prices_only', 'prices_refresh')
   * @returns Void promise
   */
  async updateData(id: string, type: string) {
    return api.post(getETFUpdateRoute(id, type), {})
  },

  /**
   * Get status of ETF updates
   * @param id ETF ID
   * @returns List of ETF update statuses
   */
  async getStatus(id: string) {
    return api.get<ETFUpdateStatus[]>(getETFStatusRoute(id))
  },

  /**
   * Get metrics for an ETF
   * @param id ETF ID
   * @returns ETF metrics
   */
  async getMetrics(id: string) {
    return api.get<ETFMetrics>(getETFMetricsRoute(id))
  }
} 