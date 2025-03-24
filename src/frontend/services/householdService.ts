import { api } from '@/frontend/lib/api-client'
import { HouseholdMember, HouseholdMemberFormData } from '@/frontend/types/household'
import { getHouseholdApiRoute, getHouseholdMemberApiRoute } from '@/frontend/lib/routes/api/household'
import { toISODateString } from '@/frontend/lib/dateUtils'

/**
 * Ensure dates are properly formatted for API requests and calculate derived date fields
 */
function formatDatesForApi(data: Partial<HouseholdMemberFormData>): Record<string, unknown> {
  const formatted = { ...data } as Record<string, unknown>;
  
  // Convert Date objects to ISO strings for the API
  if (data.birthday) {
    const birthday = data.birthday;
    formatted.birthday = toISODateString(birthday);
    
    // Calculate retirement dates if we have both birthday and retirement ages
    if (data.retirement_age_planned !== undefined) {
      const retirementDatePlanned = new Date(birthday);
      retirementDatePlanned.setFullYear(birthday.getFullYear() + data.retirement_age_planned);
      formatted.retirement_date_planned = toISODateString(retirementDatePlanned);
    }
    
    if (data.retirement_age_possible !== undefined) {
      const retirementDatePossible = new Date(birthday);
      retirementDatePossible.setFullYear(birthday.getFullYear() + data.retirement_age_possible);
      formatted.retirement_date_possible = toISODateString(retirementDatePossible);
    }
  }
  
  return formatted;
}

/**
 * Service for interacting with household API endpoints
 */
export const householdService = {
  /**
   * Fetch a list of all household members
   * @returns List of household members
   */
  async list() {
    return api.get<HouseholdMember[]>(getHouseholdApiRoute())
  },

  /**
   * Fetch a specific household member by ID
   * @param id Member ID
   * @returns Household member details
   */
  async get(id: number) {
    return api.get<HouseholdMember>(getHouseholdMemberApiRoute(id))
  },

  /**
   * Create a new household member
   * @param member Household member data
   * @returns Created household member with ID
   */
  async create(member: HouseholdMemberFormData) {
    const formattedData = formatDatesForApi(member);
    return api.post<HouseholdMember>(
      getHouseholdApiRoute(),
      formattedData
    )
  },

  /**
   * Update an existing household member
   * @param id Member ID
   * @param member Updated member data
   * @returns Updated household member
   */
  async update(id: number, member: Partial<HouseholdMemberFormData>) {
    const formattedData = formatDatesForApi(member);
    return api.put<HouseholdMember>(
      getHouseholdMemberApiRoute(id),
      formattedData
    )
  },

  /**
   * Delete a household member
   * @param id Member ID to delete
   * @returns Void promise
   */
  async delete(id: number) {
    return api.delete(getHouseholdMemberApiRoute(id))
  }
} 