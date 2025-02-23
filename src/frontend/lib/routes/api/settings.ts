import { BASE_ROUTES } from '../constants'

/**
 * Gets the base API route for settings endpoints
 */
export function getSettingsApiRoute(): string {
  return BASE_ROUTES.API.SETTINGS()
}

/**
 * Gets the API route for updating settings
 */
export function getSettingsUpdateRoute(): string {
  return getSettingsApiRoute()
} 