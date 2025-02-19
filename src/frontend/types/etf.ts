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
  ytd_return: number
  one_year_return: number
  volatility_30d: number
  sharpe_ratio: number

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

export interface YFinanceETF {
  symbol: string
  longName?: string
  shortName?: string
}

// Add a type guard
export const isYFinanceETF = (etf: ETF | YFinanceETF): etf is YFinanceETF => 
  'longName' in etf || 'shortName' in etf; 