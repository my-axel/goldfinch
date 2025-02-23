import { BASE_ROUTES } from '../constants'

/**
 * Gets the base API route for ETF endpoints
 */
export function getETFApiRoute(): string {
  return BASE_ROUTES.API.ETF()
}

/**
 * Gets the API route for a specific ETF
 */
export function getETFByIdRoute(etfId: number | string): string {
  return `${getETFApiRoute()}/${etfId}`
}

/**
 * Gets the API route for ETF search
 */
export function getETFSearchRoute(query: string): string {
  return `${getETFApiRoute()}?query=${encodeURIComponent(query)}`
}

/**
 * Gets the API route for ETF update
 */
export function getETFUpdateRoute(etfId: number | string, updateType: string): string {
  return `${getETFByIdRoute(etfId)}/update?update_type=${updateType}`
}

/**
 * Gets the API route for ETF status
 */
export function getETFStatusRoute(etfId: number | string): string {
  return `${getETFByIdRoute(etfId)}/status`
}

/**
 * Gets the API route for ETF metrics
 */
export function getETFMetricsRoute(etfId: number | string): string {
  return `${getETFByIdRoute(etfId)}/metrics`
} 