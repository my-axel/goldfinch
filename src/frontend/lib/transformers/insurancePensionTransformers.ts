import { InsurancePension } from "@/frontend/types/pension"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"

export const insurancePensionToForm = (pension: InsurancePension): InsurancePensionFormData => {
  return {
    type: pension.type,
    name: pension.name,
    member_id: pension.member_id.toString(),
    notes: pension.notes || "",
    provider: pension.provider,
    contract_number: pension.contract_number || "",
    start_date: new Date(pension.start_date),
    guaranteed_interest: pension.guaranteed_interest,
    expected_return: pension.expected_return,
    contribution_plan_steps: pension.contribution_plan_steps.map(step => ({
      amount: step.amount,
      frequency: step.frequency,
      start_date: new Date(step.start_date),
      end_date: step.end_date ? new Date(step.end_date) : undefined,
      note: step.note
    })),
    statements: pension.statements ? pension.statements.map(statement => ({
      id: statement.id,
      pension_id: statement.pension_id,
      statement_date: new Date(statement.statement_date),
      value: statement.value,
      total_contributions: statement.total_contributions,
      total_benefits: statement.total_benefits,
      costs_amount: statement.costs_amount,
      costs_percentage: statement.costs_percentage,
      note: statement.note,
      projections: statement.projections?.map(projection => ({
        id: projection.id,
        statement_id: statement.id,
        scenario_type: projection.scenario_type,
        return_rate: projection.return_rate,
        value_at_retirement: projection.value_at_retirement,
        monthly_payout: projection.monthly_payout
      })) || []
    })) : []
  }
} 