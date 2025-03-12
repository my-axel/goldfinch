import { InsurancePension } from "@/frontend/types/pension"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { 
  ensureArray, 
  withDefault,
  toDateObject,
  safeNumberValue 
} from '@/frontend/lib/utils/formUtils'

/**
 * Transforms an InsurancePension API object to InsurancePensionFormData for form usage
 * Handles date conversions, null/undefined values, and nested objects
 * 
 * @param pension - The insurance pension data from the API
 * @returns The transformed form data ready for use in forms
 */
export const insurancePensionToForm = (pension: InsurancePension): InsurancePensionFormData => {
  return {
    type: pension.type,
    name: withDefault(pension.name, ""),
    member_id: pension.member_id.toString(),
    notes: withDefault(pension.notes, ""),
    provider: pension.provider,
    contract_number: withDefault(pension.contract_number, ""),
    start_date: toDateObject(pension.start_date) || new Date(),
    guaranteed_interest: safeNumberValue(pension.guaranteed_interest) ?? 0,
    expected_return: safeNumberValue(pension.expected_return) ?? 0,
    contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
      amount: safeNumberValue(step.amount) ?? 0,
      frequency: step.frequency,
      start_date: toDateObject(step.start_date) || new Date(),
      end_date: step.end_date ? (toDateObject(step.end_date) || undefined) : undefined,
      note: withDefault(step.note, "")
    })),
    statements: ensureArray(pension.statements).map(statement => ({
      id: statement.id,
      pension_id: statement.pension_id,
      statement_date: toDateObject(statement.statement_date) || new Date(),
      value: safeNumberValue(statement.value) ?? 0,
      total_contributions: safeNumberValue(statement.total_contributions) ?? 0,
      total_benefits: safeNumberValue(statement.total_benefits) ?? 0,
      costs_amount: safeNumberValue(statement.costs_amount) ?? 0,
      costs_percentage: safeNumberValue(statement.costs_percentage) ?? 0,
      note: withDefault(statement.note, ""),
      projections: ensureArray(statement.projections).map(projection => ({
        id: projection.id,
        statement_id: statement.id,
        scenario_type: projection.scenario_type,
        return_rate: safeNumberValue(projection.return_rate) ?? 0,
        value_at_retirement: safeNumberValue(projection.value_at_retirement) ?? 0,
        monthly_payout: safeNumberValue(projection.monthly_payout) ?? 0
      }))
    }))
  }
} 