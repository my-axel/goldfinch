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
    const url = new URL('/api/v1/pension/savings', window.location.origin)
    if (memberId) url.searchParams.append('member_id', memberId.toString())
    
    const response = await fetch(url.toString())
    if (!response.ok) throw new Error('Failed to fetch savings pensions')
    return response.json()
  },
  
  /**
   * Get a specific savings pension by ID.
   * Returns the full pension data including statements and contribution plan steps.
   */
  get: async (id: number): Promise<SavingsPension> => {
    const response = await fetch(`/api/v1/pension/savings/${id}`)
    if (!response.ok) throw new Error('Failed to fetch savings pension')
    return response.json()
  },
  
  /**
   * Create a new savings pension.
   */
  create: async (data: Omit<SavingsPension, 'id'>): Promise<SavingsPension> => {
    const response = await fetch('/api/v1/pension/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create savings pension')
    return response.json()
  },
  
  /**
   * Update an existing savings pension.
   */
  update: async (id: number, data: Partial<SavingsPension>): Promise<SavingsPension> => {
    const response = await fetch(`/api/v1/pension/savings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update savings pension')
    return response.json()
  },
  
  /**
   * Delete a savings pension.
   */
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/v1/pension/savings/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete savings pension')
  },
  
  /**
   * Add a statement to a savings pension.
   */
  addStatement: async (
    pensionId: number, 
    data: Omit<SavingsPensionStatement, 'id' | 'pension_id'>
  ): Promise<SavingsPensionStatement> => {
    const response = await fetch(`/api/v1/pension/savings/${pensionId}/statements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to add savings pension statement')
    return response.json()
  },
  
  /**
   * Delete a statement from a savings pension.
   */
  deleteStatement: async (pensionId: number, statementId: number): Promise<void> => {
    const response = await fetch(`/api/v1/pension/savings/${pensionId}/statements/${statementId}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete savings pension statement')
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