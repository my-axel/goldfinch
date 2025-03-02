import * as z from "zod"
import { PensionType, ContributionFrequency } from "@/frontend/types/pension"

const basePensionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  member_id: z.string().min(1, "Member is required"),
  notes: z.string().optional()
})

// Create a shared contribution step schema to reuse
const contributionStepSchema = z.object({
  amount: z.number().gt(0, "Amount must be greater than 0"),
  frequency: z.nativeEnum(ContributionFrequency),
  start_date: z.date(),
  end_date: z.date().optional(),
  note: z.string().optional()
})

export const etfPensionSchema = basePensionSchema.extend({
  type: z.literal(PensionType.ETF_PLAN),
  etf_id: z.string().min(1, "ETF selection is required"),
  is_existing_investment: z.boolean(),
  existing_units: z.number(),
  reference_date: z.date(),
  realize_historical_contributions: z.boolean(),
  initialization_method: z.enum(["new", "existing", "historical", "none"]),
  contribution_plan_steps: z.array(contributionStepSchema)
})

export const insurancePensionSchema = basePensionSchema.extend({
  type: z.literal(PensionType.INSURANCE),
  provider: z.string().min(1, "Provider is required"),
  contract_number: z.string().min(1, "Contract number is required"),
  start_date: z.date(),
  initial_capital: z.number(),
  guaranteed_interest: z.number(),
  expected_return: z.number(),
  contribution_plan_steps: z.array(contributionStepSchema)
})

export const companyPensionSchema = basePensionSchema.extend({
  type: z.literal(PensionType.COMPANY),
  employer: z.string().min(1),
  start_date: z.date(),
  contribution_amount: z.number().optional(),
  contribution_frequency: z.nativeEnum(ContributionFrequency).optional(),
  contribution_plan_steps: z.array(contributionStepSchema),
  statements: z.array(z.object({
    statement_date: z.date(),
    value: z.number(),
    note: z.string().optional(),
    retirement_projections: z.array(z.object({
      retirement_age: z.number().min(50).max(100),
      monthly_payout: z.number().min(0),
      total_capital: z.number().min(0)
    })).optional()
  })).optional()
})

export type ETFPensionFormData = z.infer<typeof etfPensionSchema>
export type InsurancePensionFormData = z.infer<typeof insurancePensionSchema>
export type CompanyPensionFormData = z.infer<typeof companyPensionSchema> 