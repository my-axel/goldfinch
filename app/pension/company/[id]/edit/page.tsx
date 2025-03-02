"use client"

import { useForm } from "react-hook-form"
import { useRouter, useParams } from "next/navigation"
import { EditCompanyPensionForm } from "@/frontend/components/pension/company/forms/EditCompanyPensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, CompanyPension } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
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
import { ContributionHistoryCard } from "@/frontend/components/pension/company/components/ContributionHistoryCard"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { usePensionData } from "@/frontend/lib/hooks/usePensionData"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert"
import { ContributionFrequency } from "@/frontend/types/pension"

interface EditCompanyPensionPageProps {
  params: {
    id: string
  }
}

export default function EditCompanyPensionPage({ params: serverParams }: EditCompanyPensionPageProps) {
  const clientParams = useParams<{ id: string }>()
  const id = clientParams?.id || serverParams.id
  const pensionId = parseInt(id)
  
  const router = useRouter()
  const { updateCompanyPension } = usePension()
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
        start_date: data.start_date.toISOString().split('T')[0],
        contribution_amount: data.contribution_amount !== undefined ? Number(data.contribution_amount) : null,
        contribution_frequency: data.contribution_frequency || null,
        notes: data.notes || "",
        contribution_plan_steps: data.contribution_plan_steps.map(step => ({
          amount: typeof step.amount === 'string' ? parseFloat(step.amount) : step.amount,
          frequency: step.frequency,
          start_date: step.start_date.toISOString().split('T')[0],
          end_date: step.end_date ? step.end_date.toISOString().split('T')[0] : null,
          note: step.note || null
        })),
        status: pension?.status || "ACTIVE",
        statements: data.statements && data.statements.length > 0 
          ? data.statements.map(statement => ({
              id: statement.id,
              statement_date: statement.statement_date.toISOString().split('T')[0],
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
      }

      // The API expects dates as strings but the type definition uses Date objects
      // Use a type assertion to bridge this gap
      await updateCompanyPension(pensionId, pensionData as unknown as Omit<CompanyPension, 'id' | 'current_value'>)

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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left column (8/12) - Form and Cards */}
          <div className="md:col-span-8 space-y-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
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
              <>
                {/* Form */}
                <Form {...form}>
                  <form 
                    id="company-pension-form"
                    onSubmit={form.handleSubmit(handleSubmit)} 
                    className="space-y-8"
                  >
                    <EditCompanyPensionForm form={form} />
                  </form>
                </Form>

                {/* Contribution History Card */}
                <ContributionHistoryCard pension={pension} />
              </>
            )}
          </div>

          {/* Right column (4/12) - Explanation */}
          <div className="md:col-span-4">
            <div className="sticky top-6 space-y-6">
              <Explanation>
                <ExplanationHeader>Managing Your Company Pension</ExplanationHeader>
                <ExplanationContent>
                  <p>
                    Review and update your pension details based on the latest
                    statement from your company. You can add yearly investments
                    when you make additional contributions.
                  </p>
                  <p className="mt-2">
                    The contribution history shows all your past investments by month.
                    The projection values should reflect the latest estimates
                    provided by your company&apos;s pension plan statement.
                  </p>
                </ExplanationContent>
                
                <ExplanationAlert className="mt-4">
                  Regular updates to your pension information help you track your
                  retirement progress more accurately.
                </ExplanationAlert>
                
                <ExplanationHeader className="mt-6">Key Management Tasks</ExplanationHeader>
                <ExplanationList>
                  <ExplanationListItem>
                    <strong>Update Contribution Amount:</strong> When your contribution changes
                  </ExplanationListItem>
                  <ExplanationListItem>
                    <strong>Add Yearly Investments:</strong> Record additional contributions
                  </ExplanationListItem>
                  <ExplanationListItem>
                    <strong>Update Projections:</strong> When you receive a new statement
                  </ExplanationListItem>
                  <ExplanationListItem>
                    <strong>Track History:</strong> View your contribution history
                  </ExplanationListItem>
                </ExplanationList>
              </Explanation>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
} 