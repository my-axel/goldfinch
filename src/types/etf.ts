/** 
 * Represents an Exchange Traded Fund (ETF) with its core data and historical prices.
 * Historical prices are stored per day and can include trading volume.
 */
export interface ETF {
  id: string
  isin: string
  wkn?: string
  symbol: string
  name: string
  description?: string
  currency: string
  historical_prices: ETFDailyPrice[]
}

/** 
 * Daily price record for an ETF. Used for both historical tracking
 * and current value calculations.
 */
export interface ETFDailyPrice {
  etf_id: string
  date: Date
  price: number
  volume?: number
} 