import { CompanyPension } from "@/frontend/types/pension";
import { CompanyPensionFormData } from "@/frontend/types/pension-form";
import { 
  ensureArray, 
  withDefault,
  toDateObject,
  safeNumberValue 
} from '@/frontend/lib/utils/formUtils';

/**
 * Transforms a CompanyPension API object to CompanyPensionFormData for form usage
 * Handles date conversions, null/undefined values, and nested objects
 * 
 * @param pension - The company pension data from the API
 * @returns The transformed form data ready for use in forms
 */
export const companyPensionToForm = (pension: CompanyPension): CompanyPensionFormData => {
  return {
    type: pension.type,
    name: withDefault(pension.name, ""),
    member_id: pension.member_id.toString(),
    employer: withDefault(pension.employer, ""),
    notes: withDefault(pension.notes, ""),
    start_date: toDateObject(pension.start_date) || new Date(),
    contribution_amount: safeNumberValue(pension.contribution_amount),
    contribution_frequency: pension.contribution_frequency,
    contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
      amount: safeNumberValue(step.amount) ?? 0,
      frequency: step.frequency,
      start_date: toDateObject(step.start_date) || new Date(),
      end_date: step.end_date ? (toDateObject(step.end_date) || undefined) : undefined,
      note: withDefault(step.note, "")
    })),
    statements: ensureArray(pension.statements).map(statement => ({
      id: statement.id,
      statement_date: toDateObject(statement.statement_date) || new Date(),
      value: safeNumberValue(statement.value) ?? 0,
      note: withDefault(statement.note, ""),
      retirement_projections: ensureArray(statement.retirement_projections).map(projection => ({
        id: projection.id,
        retirement_age: safeNumberValue(projection.retirement_age) ?? 0,
        monthly_payout: safeNumberValue(projection.monthly_payout) ?? 0,
        total_capital: safeNumberValue(projection.total_capital) ?? 0
      }))
    }))
  };
}; 