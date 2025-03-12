"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, CompanyPension, ContributionFrequency } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/pension"
import { toast } from "sonner"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { BasicInformationCard } from "@/frontend/components/pension/company/BasicInformationCard"
import { PensionStatementsCard } from "@/frontend/components/pension/company/PensionStatementsCard"
import { zodResolver } from "@hookform/resolvers/zod"
import { companyPensionSchema } from "@/frontend/lib/validations/pension"
import { toISODateString } from "@/frontend/lib/dateUtils"
import { ContributionPlanCard } from "@/frontend/components/pension/company/ContributionPlanCard"
import { FormLayout, FormSection } from "@/frontend/components/shared"
import { BasicInformationExplanation } from "@/frontend/components/pension/company/explanations/BasicInformationExplanation"
import { ContributionPlanExplanation } from "@/frontend/components/pension/company/explanations/ContributionPlanExplanation"
import { StatementsExplanation } from "@/frontend/components/pension/company/explanations/StatementsExplanation"

const defaultValues: CompanyPensionFormData = {
  type: PensionType.COMPANY,
  name: "",
  member_id: "",
  employer: "",
  start_date: new Date(),
  contribution_amount: undefined,
  contribution_frequency: ContributionFrequency.MONTHLY,
  notes: "",
  contribution_plan_steps: [],
  statements: []
}

export default function NewCompanyPensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createCompanyPension, createCompanyPensionWithStatement } = usePension()
  
  const memberId = searchParams?.get('member_id') || ""

  const form = useForm<CompanyPensionFormData>({
    resolver: zodResolver(companyPensionSchema),
    defaultValues: {
      ...defaultValues,
      member_id: memberId
    }
  })

  const handleSubmit = async (data: CompanyPensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      // Create a pension data object that matches what the API expects
      const pensionData = {
        type: PensionType.COMPANY as const,
        name: data.name,
        member_id: memberId,
        employer: data.employer,
        start_date: toISODateString(data.start_date),
        contribution_amount: data.contribution_amount !== undefined ? Number(data.contribution_amount) : null,
        contribution_frequency: data.contribution_frequency || null,
        notes: data.notes || "",
        contribution_plan_steps: data.contribution_plan_steps.map(step => ({
          amount: typeof step.amount === 'string' ? parseFloat(step.amount) : step.amount,
          frequency: step.frequency,
          start_date: toISODateString(step.start_date),
          end_date: step.end_date ? toISODateString(step.end_date) : null,
          note: step.note || null
        })),
        status: 'ACTIVE'
      }

      // If there are statements, use createCompanyPensionWithStatement
      if (data.statements && data.statements.length > 0) {
        const firstStatement = data.statements[0]
        await createCompanyPensionWithStatement(
          pensionData as unknown as Omit<CompanyPension, 'id' | 'current_value'>,
          {
            statement_date: toISODateString(firstStatement.statement_date),
            value: typeof firstStatement.value === 'string' ? parseFloat(firstStatement.value) : firstStatement.value,
            note: firstStatement.note || "",
            retirement_projections: firstStatement.retirement_projections && firstStatement.retirement_projections.length > 0
              ? firstStatement.retirement_projections.map(projection => ({
                  retirement_age: typeof projection.retirement_age === 'string' ? 
                    parseInt(projection.retirement_age) : projection.retirement_age,
                  monthly_payout: typeof projection.monthly_payout === 'string' ? 
                    parseFloat(projection.monthly_payout) : projection.monthly_payout,
                  total_capital: typeof projection.total_capital === 'string' ? 
                    parseFloat(projection.total_capital) : projection.total_capital
                }))
              : []
          }
        )
      } else {
        // If no statements, use regular createCompanyPension
        await createCompanyPension(pensionData as unknown as Omit<CompanyPension, 'id' | 'current_value'>)
      }

      toast.success("Success", { description: "Company pension created successfully" })
      router.push(getPensionListRoute())
      router.refresh()
    } catch (error) {
      console.error('Failed to create pension:', error)
      // Error is handled by the context
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Company Pension Plan</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new company pension plan. You&apos;ll need to provide employer information
            and set up your contribution plan.
          </p>
        </div>
        
        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="company-pension-form"
          >
            Create Pension
          </Button>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form 
          id="company-pension-form"
          onSubmit={form.handleSubmit(handleSubmit)} 
        >
          <FormLayout>
            {/* Basic Information Section */}
            <FormSection
              title="Basic Information"
              description="Manage your company pension plan details and status"
              explanation={<BasicInformationExplanation />}
            >
              <BasicInformationCard form={form} />
            </FormSection>
            
            {/* Contribution Plan Section */}
            <FormSection
              title="Contribution Plan"
              description="Set up your contribution schedule"
              explanation={<ContributionPlanExplanation />}
            >
              <ContributionPlanCard form={form} />
            </FormSection>
            
            {/* Statements Section */}
            <FormSection
              title="Pension Statements"
              description="Track the value of your pension over time"
              explanation={<StatementsExplanation />}
            >
              <PensionStatementsCard form={form} />
            </FormSection>
          </FormLayout>
        </form>
      </Form>
    </div>
  )
} 