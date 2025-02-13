/**
 * Historical price data as returned by the API
 * The backend handles aggregation and time range selection
 */
export interface ETFPriceHistory {
  etf_id: string
  interval: 'daily' | 'weekly' | 'monthly'
  start_date: Date
  end_date: Date
  prices: Array<{
    date: Date
    close: number
    adjusted_close: number
  }>
}