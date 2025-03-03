"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, ContributionFrequency, CompanyPension } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { 
  Explanation, 
  ExplanationHeader, 
  ExplanationContent, 
  ExplanationAlert,
  ExplanationList,
  ExplanationListItem
} from "@/frontend/components/ui/explanation"
import { zodResolver } from "@hookform/resolvers/zod"
import { companyPensionSchema } from "@/frontend/lib/validations/pension"
import { BasicInformationCard } from "@/frontend/components/pension/company/BasicInformationCard"
import { ContributionPlanCard } from "@/frontend/components/pension/company/ContributionPlanCard"
import { PensionStatementsCard } from "@/frontend/components/pension/company/PensionStatementsCard"

export default function NewCompanyPensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createCompanyPension } = usePension()
  
  const memberId = searchParams?.get('member_id') || ""

  const form = useForm<CompanyPensionFormData>({
    resolver: zodResolver(companyPensionSchema),
    defaultValues: {
      type: PensionType.COMPANY,
      name: "",
      member_id: memberId,
      employer: "",
      start_date: new Date(),
      contribution_amount: undefined,
      contribution_frequency: ContributionFrequency.MONTHLY,
      notes: "",
      contribution_plan_steps: [],
      statements: []
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
        start_date: data.start_date instanceof Date ? data.start_date.toISOString().split('T')[0] : new Date(data.start_date).toISOString().split('T')[0],
        contribution_amount: data.contribution_amount !== undefined ? Number(data.contribution_amount) : null,
        contribution_frequency: data.contribution_frequency || null,
        notes: data.notes || "",
        contribution_plan_steps: data.contribution_plan_steps.map(step => ({
          amount: typeof step.amount === 'string' ? parseFloat(step.amount) : step.amount,
          frequency: step.frequency,
          start_date: step.start_date instanceof Date ? step.start_date.toISOString().split('T')[0] : new Date(step.start_date).toISOString().split('T')[0],
          end_date: step.end_date ? (step.end_date instanceof Date ? step.end_date.toISOString().split('T')[0] : new Date(step.end_date).toISOString().split('T')[0]) : null,
          note: step.note || null
        })),
        status: 'ACTIVE',
        statements: data.statements && data.statements.length > 0 
          ? data.statements.map(statement => ({
              statement_date: statement.statement_date instanceof Date ? statement.statement_date.toISOString().split('T')[0] : new Date(statement.statement_date).toISOString().split('T')[0],
              value: typeof statement.value === 'string' ? parseFloat(statement.value) : statement.value,
              note: statement.note || "",
              retirement_projections: statement.retirement_projections && statement.retirement_projections.length > 0
                ? statement.retirement_projections.map(projection => ({
                    retirement_age: typeof projection.retirement_age === 'string' ? 
                      parseInt(projection.retirement_age) : projection.retirement_age,
                    monthly_payout: typeof projection.monthly_payout === 'string' ? 
                      parseFloat(projection.monthly_payout) : projection.monthly_payout,
                    total_capital: typeof projection.total_capital === 'string' ? 
                      parseFloat(projection.total_capital) : projection.total_capital
                  }))
                : []
            }))
          : []
      }

      await createCompanyPension(pensionData as unknown as Omit<CompanyPension, 'id' | 'current_value'>)

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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Row 1: Basic Information Card and its explanation */}
            <div className="md:col-span-8">
              <BasicInformationCard form={form} />
            </div>
            <div className="md:col-span-4">
              <Explanation>
                <ExplanationHeader>Basic Information</ExplanationHeader>
                <ExplanationContent>
                  <p>
                    Enter the basic information about your company pension plan.
                    The contribution amount and frequency help you track your
                    regular investments.
                  </p>
                </ExplanationContent>
                <ExplanationList className="mt-4">
                  <ExplanationListItem>
                    <strong>Name:</strong> A descriptive name for your pension plan
                  </ExplanationListItem>
                  <ExplanationListItem>
                    <strong>Employer:</strong> The company providing the pension plan
                  </ExplanationListItem>
                  <ExplanationListItem>
                    <strong>Start Date:</strong> When you joined the pension plan
                  </ExplanationListItem>
                  <ExplanationListItem>
                    <strong>Contribution:</strong> Your regular contribution amount and frequency
                  </ExplanationListItem>
                </ExplanationList>
              </Explanation>
            </div>

            {/* Row 2: Contribution Plan Card and its explanation */}
            <div className="md:col-span-8">
              <ContributionPlanCard form={form} />
            </div>
            <div className="md:col-span-4">
              <Explanation>
                <ExplanationHeader>Contribution Plan</ExplanationHeader>
                <ExplanationContent>
                  <p>
                    Set up your contribution plan steps to track changes in your
                    contribution amount or frequency over time.
                  </p>
                  <p className="mt-2">
                    Each step represents a period with a specific contribution
                    amount and frequency.
                  </p>
                </ExplanationContent>
                <ExplanationAlert className="mt-4">
                  Adding detailed contribution steps helps you track your
                  pension growth more accurately.
                </ExplanationAlert>
              </Explanation>
            </div>

            {/* Row 3: Pension Statements Card and its explanation */}
            <div className="md:col-span-8">
              <PensionStatementsCard form={form} />
            </div>
            <div className="md:col-span-4">
              <Explanation>
                <ExplanationHeader>Pension Statements</ExplanationHeader>
                <ExplanationContent>
                  <p>
                    Add statements from your pension provider to track the value
                    of your pension over time.
                  </p>
                  <p className="mt-2">
                    For each statement, you can add retirement projections that
                    show expected benefits at different retirement ages.
                  </p>
                </ExplanationContent>
                <ExplanationList className="mt-4">
                  <ExplanationListItem>
                    <strong>Statement Date:</strong> When the statement was issued
                  </ExplanationListItem>
                  <ExplanationListItem>
                    <strong>Value:</strong> The current value of your pension
                  </ExplanationListItem>
                  <ExplanationListItem>
                    <strong>Projections:</strong> Expected retirement benefits
                  </ExplanationListItem>
                </ExplanationList>
              </Explanation>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
} 