import { BASE_ROUTES } from '../constants'

/**
 * Gets the base API route for household endpoints
 */
export function getHouseholdApiRoute(): string {
  return BASE_ROUTES.API.HOUSEHOLD()
}

/**
 * Gets the API route for a specific household member
 */
export function getHouseholdMemberApiRoute(memberId: number): string {
  return `${getHouseholdApiRoute()}/${memberId}`
}

/**
 * Gets the API route for fetching a member's pensions
 */
export function getMemberPensionsApiRoute(memberId: number): string {
  return `${BASE_ROUTES.API.PENSION()}/member/${memberId}`
} 