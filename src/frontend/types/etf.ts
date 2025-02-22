/** 
 * Represents an Exchange Traded Fund (ETF) as returned by the API
 */
export interface ETF {
  // Basic Information
  id: string
  isin: string
  symbol: string
  name: string
  shortName?: string
  longName?: string
  currency: string
  
  // Fund Details
  asset_class: 'Equity' | 'Fixed Income' | 'Commodity' | 'Real Estate' | 'Mixed'
  domicile: string
  inception_date: Date
  fund_size: number  // in millions
  ter: number        // Total Expense Ratio as decimal
  distribution_policy: 'Accumulating' | 'Distributing'
  
  // Latest Metrics
  last_price: number
  last_update: Date
  ytd_return: number | null
  one_year_return: number | null
  volatility_30d: number | null
  sharpe_ratio: number | null

  // Historical Data
  historical_prices?: Array<{
    date: string
    price: number
    currency: string
  }>
}

/**
 * Monthly performance data for an ETF holding in a pension plan
 * All calculations are done by the backend
 */
export interface ETFHoldingPerformance {
  pension_id: string
  etf_id: string
  date: Date
  units: number
  value: number
  total_invested: number
  total_return: number
  return_percentage: number
}

/**
 * YFinance search result type
 */
export interface YFinanceETF {
  symbol: string
  longName?: string
  shortName?: string
}

/**
 * Status of an ETF update operation
 * @property id - Unique identifier for the update operation
 * @property etf_id - ID of the ETF being updated
 * @property update_type - Type of update being performed
 * @property start_date - When the update operation started
 * @property end_date - When the update operation should end
 * @property status - Current status of the update
 * @property created_at - When the update was created
 * @property completed_at - When the update completed (if finished)
 * @property error - Error message if failed
 * @property missing_dates - List of dates where data is missing
 * @property retry_count - Number of retry attempts
 * @property notes - Additional information about the update
 */
export interface ETFUpdateStatus {
  id: number
  etf_id: string
  update_type: 'full' | 'prices_only' | 'prices_refresh'
  start_date: string
  end_date: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'completed_with_errors'
  created_at: string
  completed_at?: string
  error?: string
  missing_dates?: string[]
  retry_count: number
  notes?: string
}

/**
 * ETF metrics and performance data
 * @property update_status - Current status of the ETF's data
 * @property last_update - Timestamp of the last successful update
 * @property price_count - Number of historical prices available
 * @property unresolved_errors - Count of unresolved errors
 * @property performance_metrics - Latest performance metrics
 */
export interface ETFMetrics {
  update_status: 'up_to_date' | 'needs_update' | 'updating' | 'error'
  last_update: string
  price_count: number
  unresolved_errors: number
  performance_metrics: {
    ytd_return?: number
    one_year_return?: number
    volatility_30d?: number
    sharpe_ratio?: number
  }
}

// Add a type guard
export const isYFinanceETF = (etf: ETF | YFinanceETF): etf is YFinanceETF => 
  'longName' in etf || 'shortName' in etf; 