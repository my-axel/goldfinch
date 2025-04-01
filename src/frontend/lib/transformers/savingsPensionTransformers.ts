import { 
  SavingsPension, 
  SavingsPensionStatement, 
  PensionType,
  CompoundingFrequency,
  ContributionStep
} from "@/frontend/types/pension"
import { SavingsPensionFormData, SavingsPensionStatementFormData } from "@/frontend/types/pension-form"
import { toDateObject, toISODateString } from "@/frontend/lib/dateUtils"
import { ensureArray } from "@/frontend/lib/utils/formUtils"

/**
 * Convert API statement data to form data format
 */
export const statementToForm = (
  statement: SavingsPensionStatement
): SavingsPensionStatementFormData => ({
  id: statement.id,
  statement_date: toDateObject(statement.statement_date) || new Date(),
  balance: statement.balance,
  note: statement.note
})

/**
 * Convert form statement data to API format
 */
export const formToStatement = (
  statement: SavingsPensionStatementFormData,
  pensionId?: number
): SavingsPensionStatement => ({
  id: statement.id || 0, // Default to 0 for new statements
  pension_id: pensionId || 0, // Default to 0 for new statements
  statement_date: toISODateString(statement.statement_date),
  balance: statement.balance,
  note: statement.note
})

/**
 * Convert API pension data to form data format
 */
export const savingsPensionToForm = (
  pension: SavingsPension
): SavingsPensionFormData => ({
  type: pension.type,
  name: pension.name,
  member_id: pension.member_id.toString(),
  start_date: toDateObject(pension.start_date) || new Date(),
  notes: pension.notes,
  
  // Interest rates
  pessimistic_rate: pension.pessimistic_rate,
  realistic_rate: pension.realistic_rate,
  optimistic_rate: pension.optimistic_rate,
  
  // Compounding frequency
  compounding_frequency: pension.compounding_frequency,
  
  // Status
  status: pension.status,
  
  // Related data
  statements: ensureArray(pension.statements).map(statementToForm),
  contribution_plan_steps: ensureArray(pension.contribution_plan_steps).map(step => ({
    ...step,
    start_date: toDateObject(step.start_date) || new Date(),
    end_date: step.end_date ? (toDateObject(step.end_date) || undefined) : undefined
  }))
})

/**
 * Convert form data to API format for creation
 */
export const formToSavingsPension = (
  formData: SavingsPensionFormData
): Omit<SavingsPension, 'id'> => {
  // Convert statements first to ensure proper typing
  const statements: SavingsPensionStatement[] = formData.statements.map(statement => formToStatement(statement))
  
  // Convert contribution steps with proper date handling
  const contributionSteps: ContributionStep[] = formData.contribution_plan_steps.map(step => ({
    amount: step.amount,
    frequency: step.frequency,
    start_date: new Date(toISODateString(step.start_date)),
    end_date: step.end_date ? new Date(toISODateString(step.end_date)) : undefined,
    note: step.note
  }))
  
  return {
    type: formData.type,
    name: formData.name,
    member_id: parseInt(formData.member_id, 10),
    start_date: toISODateString(formData.start_date),
    notes: formData.notes,
    
    // Interest rates
    pessimistic_rate: formData.pessimistic_rate,
    realistic_rate: formData.realistic_rate,
    optimistic_rate: formData.optimistic_rate,
    
    // Compounding frequency
    compounding_frequency: formData.compounding_frequency,
    
    // Status
    status: formData.status,
    
    // Related data
    statements,
    contribution_plan_steps: contributionSteps
  }
}

/**
 * Default values for new savings pension forms
 */
export const defaultSavingsPensionValues: SavingsPensionFormData = {
  type: PensionType.SAVINGS,
  name: '',
  member_id: '',
  start_date: new Date(),
  notes: '',
  
  // Default interest rates
  pessimistic_rate: 1.0,
  realistic_rate: 2.0,
  optimistic_rate: 3.0,
  
  // Default compounding frequency
  compounding_frequency: CompoundingFrequency.ANNUALLY,
  
  // Default status
  status: 'ACTIVE',
  
  // Empty arrays for related data
  statements: [],
  contribution_plan_steps: []
} 