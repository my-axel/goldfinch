import { PensionType } from '@/frontend/types/pension'
import { BASE_ROUTES } from '../constants'

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
 * Gets the base API route for a pension type
 */
export function getPensionApiRoute(type: PensionType): string {
  const routeSegment = PENSION_ROUTE_MAPPING[type]
  if (!routeSegment) {
    throw new Error(`No route mapping found for pension type: ${type}`)
  }
  return BASE_ROUTES.API.PENSION(routeSegment)
}

/**
 * Gets the API route for a specific pension
 */
export function getPensionApiRouteWithId(type: PensionType, id: number): string {
  return `${getPensionApiRoute(type)}/${id}`
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

export const getPensionStatisticsRoute = (type: PensionType, id: number) => {
  return `${getPensionApiRouteWithId(type, id)}/statistics`
}

export const getPensionStatusRoute = (type: PensionType, id: number) => {
  return `${getPensionApiRouteWithId(type, id)}/status`
}

// State Pension specific routes
export const getStatePensionStatementsRoute = (pensionId: number) => {
  return `${getPensionApiRouteWithId(PensionType.STATE, pensionId)}/statements`
}

export const getStatePensionStatementRoute = (pensionId: number, statementId: number) => {
  return `${getStatePensionStatementsRoute(pensionId)}/${statementId}`
}

export const getStatePensionScenariosRoute = (pensionId: number) => {
  return `${getPensionApiRouteWithId(PensionType.STATE, pensionId)}/scenarios`
}

export const getStatePensionSummariesRoute = () => {
  return `${BASE_ROUTES.API.BASE}/pension-summaries/state`
} 