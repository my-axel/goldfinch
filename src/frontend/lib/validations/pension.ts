import * as z from "zod"
import { PensionType } from "@/frontend/types/pension"

const basePensionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  member_id: z.string().min(1, "Member is required"),
  start_date: z.string().transform(str => new Date(str)),
  initial_capital: z.number().min(0),
  type: z.nativeEnum(PensionType)
})

export const etfPensionSchema = basePensionSchema.extend({
  type: z.literal(PensionType.ETF_PLAN),
  etf_id: z.string().min(1, "ETF selection is required")
})

export const insurancePensionSchema = basePensionSchema.extend({
  type: z.literal(PensionType.INSURANCE),
  provider: z.string().min(1),
  contract_number: z.string().min(1),
  guaranteed_interest: z.number().min(0).max(1),
  expected_return: z.number().min(0).max(1)
})

export const companyPensionSchema = basePensionSchema.extend({
  type: z.literal(PensionType.COMPANY),
  employer: z.string().min(1),
  vesting_period: z.number().min(0),
  matching_percentage: z.number().min(0).max(100).optional(),
  max_employer_contribution: z.number().min(0).optional()
})

export type ETFPensionFormData = z.infer<typeof etfPensionSchema>
export type InsurancePensionFormData = z.infer<typeof insurancePensionSchema>
export type CompanyPensionFormData = z.infer<typeof companyPensionSchema> 