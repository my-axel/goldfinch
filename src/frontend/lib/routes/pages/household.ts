import { BASE_ROUTES } from '../constants'

/**
 * Gets the household list page route
 */
export function getHouseholdListRoute(): string {
  return BASE_ROUTES.PAGES.HOUSEHOLD
}

/**
 * Gets the route for viewing household member details
 */
export function getHouseholdMemberDetailsRoute(memberId: number): string {
  return `${getHouseholdListRoute()}/${memberId}`
}

/**
 * Gets the route for editing a household member
 */
export function getHouseholdMemberEditRoute(memberId: number): string {
  return `${getHouseholdMemberDetailsRoute(memberId)}/edit`
} 