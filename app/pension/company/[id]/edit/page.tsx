"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, CompanyPension, ContributionFrequency } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/pension"
import { toast } from "sonner"
import { use } from "react"
import { useEffect } from "react"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { 
  Explanation, 
  ExplanationHeader, 
  ExplanationContent, 
  ExplanationAlert,
  ExplanationList,
  ExplanationListItem
} from "@/frontend/components/ui/explanation"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { BasicInformationCard } from "@/frontend/components/pension/company/BasicInformationCard"
import { ContributionPlanCard } from "@/frontend/components/pension/company/ContributionPlanCard"
import { PensionStatementsCard } from "@/frontend/components/pension/company/PensionStatementsCard"
import { ContributionHistoryCard } from "@/frontend/components/pension/company/ContributionHistoryCard"
import { usePensionData } from "@/frontend/lib/hooks/usePensionData"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert"
import { toISODateString } from "@/frontend/lib/dateUtils"

interface EditCompanyPensionPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditCompanyPensionPage({ params }: EditCompanyPensionPageProps) {
  const router = useRouter()
  const { updateCompanyPensionWithStatement, updateCompanyPension, createCompanyPensionStatement } = usePension()
  const resolvedParams = use(params)
  const pensionId = parseInt(resolvedParams.id)
  const { data: pension, isLoading, error } = usePensionData<CompanyPension>(pensionId, PensionType.COMPANY)

  const form = useForm<CompanyPensionFormData>({
    defaultValues: {
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
  })

  // Reset form when pension data is available
  useEffect(() => {
    if (!pension || isLoading) {
      return
    }

    const statementsCopy = pension.statements ? 
      pension.statements.map(statement => ({
        id: statement.id,
        statement_date: new Date(statement.statement_date),
        value: statement.value,
        note: statement.note || "",
        retirement_projections: statement.retirement_projections ? 
          statement.retirement_projections.map(projection => ({
            id: projection.id,
            retirement_age: projection.retirement_age,
            monthly_payout: projection.monthly_payout,
            total_capital: projection.total_capital
          })) : []
      })) : []

    const contributionStepsCopy = pension.contribution_plan_steps.map(step => ({
      amount: step.amount,
      frequency: step.frequency,
      start_date: new Date(step.start_date),
      end_date: step.end_date ? new Date(step.end_date) : undefined,
      note: step.note
    }))

    // Ensure contribution_frequency is a valid enum value or default to MONTHLY
    let contributionFrequency = ContributionFrequency.MONTHLY;
    
    if (pension.contribution_frequency && 
        Object.values(ContributionFrequency).includes(pension.contribution_frequency as ContributionFrequency)) {
      contributionFrequency = pension.contribution_frequency as ContributionFrequency;
    }
    
    // Reset the form with all fields including contribution_frequency
    form.reset({
      type: PensionType.COMPANY,
      name: pension.name,
      member_id: pension.member_id.toString(),
      employer: pension.employer,
      start_date: new Date(pension.start_date),
      contribution_amount: pension.contribution_amount,
      contribution_frequency: contributionFrequency,
      notes: pension.notes || "",
      contribution_plan_steps: contributionStepsCopy,
      statements: statementsCopy
    }, {
      keepDefaultValues: false
    });
  }, [pension, isLoading, form])

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
        status: pension?.status || "ACTIVE"
      }

      // Extract statements data
      const statements = data.statements && data.statements.length > 0 
        ? data.statements.map(statement => ({
            id: statement.id,
            statement_date: toISODateString(statement.statement_date),
            value: typeof statement.value === 'string' ? parseFloat(statement.value) : statement.value,
            note: statement.note || "",
            retirement_projections: statement.retirement_projections && statement.retirement_projections.length > 0
              ? statement.retirement_projections.map(projection => ({
                  id: projection.id,
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

      // Separate existing and new statements
      const existingStatements = statements.filter(statement => typeof statement.id === 'number')
      const newStatements = statements.filter(statement => !statement.id)

      // First update the pension and existing statements
      if (existingStatements.length > 0) {
        await updateCompanyPensionWithStatement(
          pensionId, 
          pensionData as unknown as Omit<CompanyPension, 'id' | 'current_value'>,
          existingStatements as Array<{
            id: number;
            statement_date: string;
            value: number;
            note?: string;
            retirement_projections?: Array<{
              id?: number;
              retirement_age: number;
              monthly_payout: number;
              total_capital: number;
            }>;
          }>
        )
      } else {
        // If no existing statements, just update the pension data
        await updateCompanyPension(pensionId, pensionData as unknown as Omit<CompanyPension, 'id' | 'current_value'>)
      }

      // Then create any new statements
      for (const statement of newStatements) {
        await createCompanyPensionStatement(
          pensionId,
          {
            statement_date: statement.statement_date,
            value: statement.value,
            note: statement.note,
            retirement_projections: statement.retirement_projections
          }
        )
      }

      toast.success("Success", { description: "Company pension updated successfully" })
      router.push(getPensionListRoute())
      router.refresh()
    } catch (error) {
      console.error('Failed to update pension:', error)
      // Error is handled by the context
    }
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10">
        {/* Page header with title and buttons */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Company Pension Plan</h1>
            <p className="text-muted-foreground mt-2">
              Update your company pension plan details and contribution schedule.
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
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading pension details..." />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : !pension ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Pension not found</AlertDescription>
          </Alert>
        ) : pension.type !== PensionType.COMPANY ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Invalid pension type</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form 
              id="company-pension-form"
              onSubmit={form.handleSubmit(handleSubmit)} 
            >
              {/* Grid Layout with aligned explanations */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Row 1: Basic Information */}
                <div className="md:col-span-8">
                  <BasicInformationCard form={form} />
                </div>
                <div className="md:col-span-4">
                  <Explanation>
                    <ExplanationHeader>Basic Information</ExplanationHeader>
                    <ExplanationContent>
                      <p>
                        Keep your pension details up to date with the latest information from your employer.
                        The basic information section contains essential details about your company pension plan.
                      </p>
                    </ExplanationContent>
                    <ExplanationAlert className="mt-4">
                      You can pause your pension if contributions are temporarily stopped and resume it when they restart.
                    </ExplanationAlert>
                  </Explanation>
                </div>

                {/* Row 2: Contribution Plan */}
                <div className="md:col-span-8">
                  <ContributionPlanCard form={form} />
                </div>
                <div className="md:col-span-4">
                  <Explanation>
                    <ExplanationHeader>Contribution Plan</ExplanationHeader>
                    <ExplanationContent>
                      <p>
                        The contribution plan allows you to track changes in your contribution amount over time.
                        Add steps to record when your contribution amount changes.
                      </p>
                      <ExplanationList className="mt-4">
                        <ExplanationListItem>Each step represents a period with a specific contribution amount</ExplanationListItem>
                        <ExplanationListItem>Set an end date when you know how long this contribution will last</ExplanationListItem>
                        <ExplanationListItem>Leave the end date empty for ongoing contributions</ExplanationListItem>
                      </ExplanationList>
                    </ExplanationContent>
                  </Explanation>
                </div>

                {/* Row 3: Pension Statements */}
                <div className="md:col-span-8">
                  <PensionStatementsCard form={form} pensionId={pensionId} />
                </div>
                <div className="md:col-span-4">
                  <Explanation>
                    <ExplanationHeader>Pension Statements</ExplanationHeader>
                    <ExplanationContent>
                      <p>
                        Record the information from your pension statements to track the growth of your pension over time.
                        Add retirement projections to see how your pension might perform in the future.
                      </p>
                      <ExplanationList className="mt-4">
                        <ExplanationListItem>Add a statement each time you receive one from your provider</ExplanationListItem>
                        <ExplanationListItem>Record the projected monthly payout and total capital at retirement</ExplanationListItem>
                        <ExplanationListItem>Compare projections for different retirement ages</ExplanationListItem>
                      </ExplanationList>
                    </ExplanationContent>
                  </Explanation>
                </div>

                {/* Row 4: Contribution History */}
                <div className="md:col-span-8">
                  <ContributionHistoryCard pension={pension} />
                </div>
                <div className="md:col-span-4">
                  <Explanation>
                    <ExplanationHeader>Contribution History</ExplanationHeader>
                    <ExplanationContent>
                      <p>
                        Your contribution history shows all past contributions to this pension plan.
                        This helps you track your investment over time.
                      </p>
                      <p className="mt-2">
                        Contributions are automatically recorded based on your contribution plan,
                        but you can also manually add one-time contributions.
                      </p>
                    </ExplanationContent>
                    <ExplanationAlert className="mt-4">
                      Regular tracking of contributions helps you understand your pension&apos;s growth pattern.
                    </ExplanationAlert>
                  </Explanation>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </ErrorBoundary>
  )
} 