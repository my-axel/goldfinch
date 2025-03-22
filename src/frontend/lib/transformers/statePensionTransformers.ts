import { StatePension } from "@/frontend/types/pension"
import { StatePensionFormData } from "@/frontend/types/pension-form"
import { 
  ensureArray, 
  withDefault,
  toDateObject,
  safeNumberValue 
} from '@/frontend/lib/utils/formUtils'
import { PensionType } from "@/frontend/types/pension"

/**
 * Transforms a StatePension API object to StatePensionFormData for form usage
 * Handles date conversions, null/undefined values, and nested objects
 * 
 * @param pension - The state pension data from the API
 * @returns The transformed form data ready for use in forms
 */
export const statePensionToForm = (pension: StatePension): StatePensionFormData => {
  return {
    type: PensionType.STATE,
    name: withDefault(pension.name, ""),
    member_id: pension.member_id.toString(),
    notes: withDefault(pension.notes, ""),
    start_date: toDateObject(pension.start_date) || new Date(),
    status: pension.status || 'ACTIVE',
    statements: ensureArray(pension.statements).map(statement => ({
      id: statement.id,
      pension_id: statement.pension_id,
      statement_date: toDateObject(statement.statement_date) || new Date(),
      current_monthly_amount: safeNumberValue(statement.current_monthly_amount),
      projected_monthly_amount: safeNumberValue(statement.projected_monthly_amount),
      current_value: safeNumberValue(statement.current_value),
      note: withDefault(statement.note, "")
    }))
  }
} 