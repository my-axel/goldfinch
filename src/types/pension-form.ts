import { PensionType } from "./pension"

export type FormData = {
  type: PensionType
  name: string
  member_id: string
  start_date: Date
  initial_capital: number
} & (
  | { type: PensionType.ETF_PLAN, automatic_rebalancing: boolean }
  | { type: PensionType.INSURANCE, provider: string, contract_number: string }
  | { type: PensionType.COMPANY, employer: string, vesting_period: number }
) 