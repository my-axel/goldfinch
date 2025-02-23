import { PensionType } from '@/frontend/types/pension'
import { BASE_ROUTES } from '../constants'
import { PENSION_ROUTE_MAPPING } from '../api/pension'

/**
 * Gets the pension list route
 */
export function getPensionListRoute(): string {
  return BASE_ROUTES.PAGES.PENSION
}

/**
 * Gets the route for viewing pension details
 */
export function getPensionDetailsRoute(type: PensionType, id: number): string {
  const routeSegment = PENSION_ROUTE_MAPPING[type]
  if (!routeSegment) {
    throw new Error(`No route mapping found for pension type: ${type}`)
  }
  return `${getPensionListRoute()}/${routeSegment}/${id}`
}

/**
 * Gets the route for editing a pension
 */
export function getPensionEditRoute(type: PensionType, id: number): string {
  return `${getPensionDetailsRoute(type, id)}/edit`
}

/**
 * Gets the route for creating a new pension
 */
export function getNewPensionRoute(type: PensionType, memberId?: string): string {
  const routeSegment = PENSION_ROUTE_MAPPING[type]
  if (!routeSegment) {
    throw new Error(`No route mapping found for pension type: ${type}`)
  }
  const baseRoute = `${getPensionListRoute()}/${routeSegment}/new`
  return memberId ? `${baseRoute}?member_id=${memberId}` : baseRoute
} 