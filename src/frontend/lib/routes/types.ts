import { PensionType } from '@/frontend/types/pension'
import { PENSION_ROUTE_MAPPING } from './api/pension'
import { API_VERSION } from './api/constants'

export type ApiRoutes = {
  VERSION: typeof API_VERSION
  BASE: string
  PENSION: (type?: string) => string
  HOUSEHOLD: () => string
  ETF: () => string
  EXCHANGE_RATES: () => string
  SETTINGS: () => string
}

export type PageRoutes = {
  HOME: string
  PENSION: string
  HOUSEHOLD: string
  DASHBOARD: string
  SETTINGS: string
}

export type PensionRouteSegment = typeof PENSION_ROUTE_MAPPING[PensionType]

export type BaseRoutes = {
  API: ApiRoutes
  PAGES: PageRoutes
} 