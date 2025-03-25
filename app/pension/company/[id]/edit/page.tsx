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
import { useState, useMemo } from "react"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { BasicInformationCard } from "@/frontend/components/pension/company/BasicInformationCard"
import { ContributionPlanCard } from "@/frontend/components/pension/company/ContributionPlanCard"
import { PensionStatementsCard } from "@/frontend/components/pension/company/PensionStatementsCard"
import { ContributionHistoryCard } from "@/frontend/components/pension/company/ContributionHistoryCard"
import { usePensionData } from "@/frontend/lib/hooks/usePensionData"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert"
import { toISODateString } from "@/frontend/lib/dateUtils"
import { FormLayout, FormSection } from "@/frontend/components/shared"
import { BasicInformationExplanation } from "@/frontend/components/pension/company/explanations/BasicInformationExplanation"
import { ContributionPlanExplanation } from "@/frontend/components/pension/company/explanations/ContributionPlanExplanation"
import { StatementsExplanation } from "@/frontend/components/pension/company/explanations/StatementsExplanation"
import { ContributionHistoryExplanation } from "@/frontend/components/pension/company/explanations/ContributionHistoryExplanation"
import { PensionStatusActions } from "@/frontend/components/pension/shared/PensionStatusActions"
import { PauseConfirmationDialog } from "@/frontend/components/pension/shared/dialogs/PauseConfirmationDialog"
import { ResumeDateDialog } from "@/frontend/components/pension/shared/dialogs/ResumeDateDialog"
import { useFormReset } from "@/frontend/lib/hooks/useFormReset"
import { companyPensionToForm } from "@/frontend/lib/transformers/companyPensionTransformers"

interface EditCompanyPensionPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditCompanyPensionPage({ params }: EditCompanyPensionPageProps) {
  const router = useRouter()
  const { updateCompanyPensionWithStatement, updateCompanyPension, createCompanyPensionStatement, updatePensionStatus } = usePension()
  const resolvedParams = use(params)
  const pensionId = parseInt(resolvedParams.id)
  const { data: pension, isLoading, error } = usePensionData<CompanyPension>(pensionId, PensionType.COMPANY)
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)

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

  // Extract defaultValues to a stable reference using useMemo
  const stableDefaultValues = useMemo(() => defaultValues, [])

  const form = useForm<CompanyPensionFormData>({
    defaultValues: stableDefaultValues
  })

  // Use the form reset hook with stable defaultValues
  useFormReset({
    data: pension,
    form,
    apiToForm: companyPensionToForm,
    defaultValues: stableDefaultValues
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

  const handlePauseConfirm = async (pauseDate: Date) => {
    if (!pension) return

    try {
      await updatePensionStatus(pensionId, {
        status: 'PAUSED',
        paused_at: pauseDate.toISOString().split('T')[0]
      })
      setShowPauseDialog(false)
      toast.success("Success", { description: "Pension paused successfully" })
    } catch (error) {
      console.error('Error updating pension status:', error)
      toast.error('Error', {
        description: 'Failed to update pension status'
      })
    }
  }

  const handleResumeConfirm = async (resumeDate: Date) => {
    if (!pension) return

    try {
      await updatePensionStatus(pensionId, {
        status: 'ACTIVE',
        resume_at: resumeDate.toISOString().split('T')[0]
      })
      setShowResumeDialog(false)
      toast.success("Success", { description: "Pension resumed successfully" })
    } catch (error) {
      console.error('Error updating pension status:', error)
      toast.error('Error', {
        description: 'Failed to update pension status'
      })
    }
  }

  return (
    <ErrorBoundary>
      <div className="container py-10">
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
              <FormLayout>
                {/* Basic Information Section */}
                <FormSection
                  title="Basic Information"
                  description="Keep your pension details up to date with the latest information from your employer"
                  explanation={<BasicInformationExplanation />}
                  headerActions={
                    <PensionStatusActions
                      status={pension.status}
                      onPause={() => setShowPauseDialog(true)}
                      onResume={() => setShowResumeDialog(true)}
                    />
                  }
                >
                  <BasicInformationCard form={form} />
                </FormSection>
                
                {/* Contribution Plan Section */}
                <FormSection
                  title="Contribution Plan"
                  description="Track changes in your contribution amount over time"
                  explanation={<ContributionPlanExplanation />}
                >
                  <ContributionPlanCard form={form} />
                </FormSection>
                
                {/* Statements Section */}
                <FormSection
                  title="Pension Statements"
                  description="Record information from your pension statements to track growth"
                  explanation={<StatementsExplanation />}
                >
                  <PensionStatementsCard form={form} pensionId={pensionId} />
                </FormSection>
                
                {/* Contribution History Section */}
                <FormSection
                  title="Contribution History"
                  description="View all past contributions to this pension plan"
                  explanation={<ContributionHistoryExplanation />}
                >
                  <ContributionHistoryCard pension={pension} />
                </FormSection>
              </FormLayout>
            </form>
          </Form>
        )}

        {/* Status change dialogs */}
        <PauseConfirmationDialog
          open={showPauseDialog}
          onOpenChange={setShowPauseDialog}
          onConfirm={handlePauseConfirm}
        />

        <ResumeDateDialog
          open={showResumeDialog}
          onOpenChange={setShowResumeDialog}
          onConfirm={handleResumeConfirm}
        />
      </div>
    </ErrorBoundary>
  )
} 