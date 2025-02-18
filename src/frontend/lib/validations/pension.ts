import * as z from "zod"
import { PensionType, ContributionFrequency } from "@/frontend/types/pension"

const basePensionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  member_id: z.string().min(1, "Member is required"),
  notes: z.string().optional()
})

export const etfPensionSchema = basePensionSchema.extend({
  type: z.literal(PensionType.ETF_PLAN),
  etf_id: z.string().min(1, "ETF selection is required"),
  is_existing_investment: z.boolean(),
  existing_units: z.number(),
  reference_date: z.date(),
  realize_historical_contributions: z.boolean(),
  initialization_method: z.enum(["new", "existing", "historical", "none"]),
  contribution_plan_steps: z.array(z.object({
    amount: z.number(),
    frequency: z.nativeEnum(ContributionFrequency),
    start_date: z.date(),
    end_date: z.date().optional()
  }))
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