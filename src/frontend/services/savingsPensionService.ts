import { 
  SavingsPension, 
  SavingsPensionList, 
  SavingsPensionProjection, 
  SavingsPensionStatement,
  PensionStatusUpdate,
  PensionType
} from "@/frontend/types/pension"
import { getPensionStatusRoute } from "@/frontend/lib/routes/api/pension"
import { api } from "@/frontend/lib/api-client"

/**
 * Service for interacting with savings pension endpoints.
 * All monetary values are in the base currency (EUR).
 */
export const savingsPensionService = {
  /**
   * Get all savings pensions, optionally filtered by member ID.
   * Returns a lightweight representation for list views.
   */
  getAll: async (memberId?: number): Promise<SavingsPensionList[]> => {
    let url = '/api/v1/pension/savings';
    if (memberId) url += `?member_id=${memberId}`;
    return api.get<SavingsPensionList[]>(url);
  },
  
  /**
   * Get a specific savings pension by ID.
   * Returns the full pension data including statements and contribution plan steps.
   */
  get: async (id: number): Promise<SavingsPension> => {
    return api.get<SavingsPension>(`/api/v1/pension/savings/${id}`);
  },
  
  /**
   * Create a new savings pension.
   */
  create: async (data: Omit<SavingsPension, 'id'>): Promise<SavingsPension> => {
    return api.post<SavingsPension, Omit<SavingsPension, 'id'>>('/api/v1/pension/savings', data);
  },
  
  /**
   * Update an existing savings pension.
   */
  update: async (id: number, data: Partial<SavingsPension>): Promise<SavingsPension> => {
    return api.patch<SavingsPension, Partial<SavingsPension>>(`/api/v1/pension/savings/${id}`, data);
  },
  
  /**
   * Delete a savings pension.
   */
  delete: async (id: number): Promise<void> => {
    await api.delete<void>(`/api/v1/pension/savings/${id}`);
  },
  
  /**
   * Add a statement to a savings pension.
   */
  addStatement: async (
    pensionId: number, 
    data: Omit<SavingsPensionStatement, 'id' | 'pension_id'>
  ): Promise<SavingsPensionStatement> => {
    return api.post<SavingsPensionStatement, Omit<SavingsPensionStatement, 'id' | 'pension_id'>>(`/api/v1/pension/savings/${pensionId}/statements`, data);
  },
  
  /**
   * Delete a statement from a savings pension.
   */
  deleteStatement: async (pensionId: number, statementId: number): Promise<void> => {
    await api.delete<void>(`/api/v1/pension/savings/${pensionId}/statements/${statementId}`);
  },
  
  /**
   * Calculate projection scenarios for a savings pension.
   * Returns scenarios for both planned and possible retirement dates.
   */
  getProjections: async (
    id: number, 
    referenceDate?: string
  ): Promise<SavingsPensionProjection> => {
    const url = new URL(`/api/v1/pension/savings/${id}/scenarios`, window.location.origin)
    if (referenceDate) url.searchParams.append('reference_date', referenceDate)
    
    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('Failed to fetch savings pension projections')
    return response.json()
  },
  
  /**
   * Update the status of a savings pension
   * @param id Pension ID
   * @param statusData Status update data including status and dates
   * @returns Updated savings pension
   */
  updateStatus: async (
    id: number,
    statusData: PensionStatusUpdate
  ): Promise<SavingsPension> => {
    return api.put<SavingsPension>(
      getPensionStatusRoute(PensionType.SAVINGS, id),
      {...statusData} as unknown as Record<string, unknown>
    )
  }
} 