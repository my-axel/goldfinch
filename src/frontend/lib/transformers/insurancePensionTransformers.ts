import { InsurancePension } from "@/frontend/types/pension"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { safeNumberValue } from "@/frontend/lib/transforms"

export const insurancePensionToForm = (pension: InsurancePension): InsurancePensionFormData => {
  return {
    type: pension.type,
    name: pension.name,
    member_id: pension.member_id.toString(),
    notes: pension.notes || "",
    provider: pension.provider,
    contract_number: pension.contract_number || "",
    start_date: new Date(pension.start_date),
    guaranteed_interest: safeNumberValue(pension.guaranteed_interest) ?? 0,
    expected_return: safeNumberValue(pension.expected_return) ?? 0,
    contribution_plan_steps: pension.contribution_plan_steps.map(step => ({
      amount: safeNumberValue(step.amount) ?? 0,
      frequency: step.frequency,
      start_date: new Date(step.start_date),
      end_date: step.end_date ? new Date(step.end_date) : undefined,
      note: step.note || ""
    })),
    statements: pension.statements ? pension.statements.map(statement => ({
      id: statement.id,
      pension_id: statement.pension_id,
      statement_date: new Date(statement.statement_date),
      value: safeNumberValue(statement.value) ?? 0,
      total_contributions: safeNumberValue(statement.total_contributions) ?? 0,
      total_benefits: safeNumberValue(statement.total_benefits) ?? 0,
      costs_amount: safeNumberValue(statement.costs_amount) ?? 0,
      costs_percentage: safeNumberValue(statement.costs_percentage) ?? 0,
      note: statement.note || "",
      projections: statement.projections?.map(projection => ({
        id: projection.id,
        statement_id: statement.id,
        scenario_type: projection.scenario_type,
        return_rate: safeNumberValue(projection.return_rate) ?? 0,
        value_at_retirement: safeNumberValue(projection.value_at_retirement) ?? 0,
        monthly_payout: safeNumberValue(projection.monthly_payout) ?? 0
      })) || []
    })) : []
  }
} 