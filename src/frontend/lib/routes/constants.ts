import { API_VERSION } from './api/constants'

export const BASE_ROUTES = {
  API: {
    VERSION: API_VERSION,
    BASE: `/api/${API_VERSION}`,
    PENSION: (type?: string) => `${BASE_ROUTES.API.BASE}/pension${type ? `/${type}` : ''}`,
    HOUSEHOLD: () => `${BASE_ROUTES.API.BASE}/household`,
    ETF: () => `${BASE_ROUTES.API.BASE}/etf`,
    EXCHANGE_RATES: () => `${BASE_ROUTES.API.BASE}/exchange-rates`,
    SETTINGS: () => `${BASE_ROUTES.API.BASE}/settings`
  },
  PAGES: {
    HOME: '/',
    PENSION: '/pension',
    HOUSEHOLD: '/household',
    DASHBOARD: '/dashboard',
    SETTINGS: '/settings'
  }
} as const 