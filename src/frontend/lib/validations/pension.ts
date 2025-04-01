import * as z from "zod"
import { PensionType, ContributionFrequency, CompoundingFrequency } from "@/frontend/types/pension"

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
  provider: z.string().min(1),
  contract_number: z.string().optional(),
  start_date: z.date(),
  guaranteed_interest: z.number().min(0).max(100).optional(),
  expected_return: z.number().min(0).max(100).optional(),
  contribution_plan_steps: z.array(contributionStepSchema),
  statements: z.array(z.object({
    id: z.number().optional(),
    statement_date: z.date(),
    value: z.number().min(0),
    total_contributions: z.number().min(0),
    total_benefits: z.number().min(0),
    costs_amount: z.number().gt(0, { message: "Costs amount must be positive" }),
    costs_percentage: z.number().min(0).max(100, { message: "Costs percentage must be between 0 and 100" }),
    note: z.string().optional(),
    projections: z.array(z.object({
      id: z.number().optional(),
      scenario_type: z.enum(['with_contributions', 'without_contributions']),
      return_rate: z.number().min(0).max(100),
      value_at_retirement: z.number().min(0),
      monthly_payout: z.number().min(0)
    })).optional()
  })).optional()
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

export const statePensionSchema = basePensionSchema.extend({
  type: z.literal(PensionType.STATE),
  start_date: z.date(),
  status: z.enum(['ACTIVE', 'PAUSED']).default('ACTIVE'),
  statements: z.array(z.object({
    id: z.number().optional(),
    statement_date: z.date(),
    current_monthly_amount: z.number().min(0).optional(),
    projected_monthly_amount: z.number().min(0).optional(),
    current_value: z.number().min(0).optional(),
    note: z.string().optional()
  })).default([])
})

export const savingsPensionSchema = basePensionSchema.extend({
  type: z.literal(PensionType.SAVINGS),
  start_date: z.date(),
  status: z.enum(['ACTIVE', 'PAUSED']).default('ACTIVE'),
  
  // Interest rates with constraints
  pessimistic_rate: z.number().min(0).max(20, "Rate must be between 0% and 20%"),
  realistic_rate: z.number().min(0).max(20, "Rate must be between 0% and 20%"),
  optimistic_rate: z.number().min(0).max(20, "Rate must be between 0% and 20%"),
  
  // Compounding frequency
  compounding_frequency: z.nativeEnum(CompoundingFrequency),
  
  // Related data
  statements: z.array(z.object({
    id: z.number().optional(),
    statement_date: z.date(),
    balance: z.number().min(0, "Balance must be positive"),
    note: z.string().optional()
  })).default([]),
  
  contribution_plan_steps: z.array(contributionStepSchema).default([])
}).refine(
  (data) => data.pessimistic_rate <= data.realistic_rate,
  {
    message: "Pessimistic rate must be less than or equal to realistic rate",
    path: ["pessimistic_rate"]
  }
).refine(
  (data) => data.realistic_rate <= data.optimistic_rate, 
  {
    message: "Realistic rate must be less than or equal to optimistic rate",
    path: ["realistic_rate"]
  }
)

export type ETFPensionFormData = z.infer<typeof etfPensionSchema>
export type InsurancePensionFormData = z.infer<typeof insurancePensionSchema>
export type CompanyPensionFormData = z.infer<typeof companyPensionSchema>
export type StatePensionFormData = z.infer<typeof statePensionSchema>
export type SavingsPensionFormData = z.infer<typeof savingsPensionSchema> 