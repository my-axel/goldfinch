import { PensionType } from "@/frontend/types/pension"

/**
 * Maps pension types to their corresponding route segments
 */
export const PENSION_ROUTE_MAPPING: Record<PensionType, string> = {
  [PensionType.ETF_PLAN]: 'etf',
  [PensionType.INSURANCE]: 'insurance',
  [PensionType.COMPANY]: 'company',
  [PensionType.STATE]: 'state'
} as const

/**
 * Type for pension route segments
 */
export type PensionRouteSegment = typeof PENSION_ROUTE_MAPPING[PensionType]

/**
 * Base routes
 */
const ROUTES = {
  PENSION: {
    LIST: '/pension',
    API: '/pension'
  }
} as const

/**
 * Gets the base API route for a pension type
 */
export function getPensionApiRoute(type: PensionType): string {
  const routeSegment = PENSION_ROUTE_MAPPING[type]
  if (!routeSegment) {
    throw new Error(`No route mapping found for pension type: ${type}`)
  }
  return `${ROUTES.PENSION.API}/${routeSegment}`
}

/**
 * Gets the API route for a specific pension
 */
export function getPensionApiRouteWithId(type: PensionType, id: number): string {
  return `${getPensionApiRoute(type)}/${id}`
}

/**
 * Gets the pension list route
 */
export function getPensionListRoute(): string {
  return ROUTES.PENSION.LIST
}

/**
 * Gets the route for viewing pension details
 */
export function getPensionDetailsRoute(type: PensionType, id: number): string {
  const routeSegment = PENSION_ROUTE_MAPPING[type]
  if (!routeSegment) {
    throw new Error(`No route mapping found for pension type: ${type}`)
  }
  return `${ROUTES.PENSION.LIST}/${routeSegment}/${id}`
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
  const baseRoute = `${ROUTES.PENSION.LIST}/${routeSegment}/new`
  return memberId ? `${baseRoute}?member_id=${memberId}` : baseRoute
}

/**
 * Gets the API route for realizing historical contributions
 */
export function getPensionRealizeHistoricalRoute(type: PensionType, id: number): string {
  return `${getPensionApiRouteWithId(type, id)}/realize-historical`
}

/**
 * Gets the API route for one-time investments
 */
export function getPensionOneTimeInvestmentRoute(type: PensionType, id: number): string {
  return `${getPensionApiRouteWithId(type, id)}/one-time-investment`
} 