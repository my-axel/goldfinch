import { ETFPension } from "@/frontend/types/pension"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { 
  ensureArray, 
  withDefault,
  toDateObject,
  safeNumberValue 
} from '@/frontend/lib/utils/formUtils'

/**
 * Transforms an ETFPension API object to ETFPensionFormData for form usage
 * Handles date conversions, null/undefined values, and nested objects
 * 
 * @param pension - The ETF pension data from the API
 * @returns The transformed form data ready for use in forms
 */
export const etfPensionToForm = (pension: ETFPension): ETFPensionFormData => {
  return {
    type: pension.type,
    name: withDefault(pension.name, ""),
    member_id: pension.member_id.toString(),
    etf_id: withDefault(pension.etf_id, ""),
    notes: withDefault(pension.notes, ""),
    is_existing_investment: pension.is_existing_investment || false,
    existing_units: safeNumberValue(pension.existing_units) ?? 0,
    reference_date: toDateObject(pension.reference_date) || new Date(),
    initialization_method: pension.realize_historical_contributions ? "historical" : 
                           pension.is_existing_investment ? "existing" : "new",
    realize_historical_contributions: pension.realize_historical_contributions || false,
    contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
      amount: safeNumberValue(step.amount) ?? 0,
      frequency: step.frequency,
      start_date: toDateObject(step.start_date) || new Date(),
      end_date: step.end_date ? (toDateObject(step.end_date) || undefined) : undefined,
      note: withDefault(step.note, "")
    }))
  };
}; 