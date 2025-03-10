"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { PensionType, InsurancePension } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/pension"
import { toast } from "sonner"
import { use } from "react"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { BasicInformationCard } from "@/frontend/components/pension/insurance/BasicInformationCard"
import { ContributionDetailsCard } from "@/frontend/components/pension/insurance/ContributionDetailsCard"
import { StatementsCard } from "@/frontend/components/pension/insurance/StatementsCard"
import { BasicInformationExplanation } from "@/frontend/components/pension/insurance/explanations/BasicInformationExplanation"
import { ContributionDetailsExplanation } from "@/frontend/components/pension/insurance/explanations/ContributionDetailsExplanation"
import { StatementsExplanation } from "@/frontend/components/pension/insurance/explanations/StatementsExplanation"
import { zodResolver } from "@hookform/resolvers/zod"
import { insurancePensionSchema } from "@/frontend/lib/validations/pension"
import { usePensionData } from "@/frontend/lib/hooks/usePensionData"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert"
import { useFormReset } from "@/frontend/lib/hooks/useFormReset"
import { insurancePensionToForm } from "@/frontend/lib/transformers/insurancePensionTransformers"
import { toISODateString } from "@/frontend/lib/dateUtils"
import { FormLayout } from "@/frontend/components/shared/FormLayout"
import { FormSection } from "@/frontend/components/shared/FormSection"
import { PauseConfirmationDialog } from "@/frontend/components/pension/shared/dialogs/PauseConfirmationDialog"
import { ResumeDateDialog } from "@/frontend/components/pension/shared/dialogs/ResumeDateDialog"
import { useState } from "react"
import { PensionStatusActions } from "@/frontend/components/pension/shared/PensionStatusActions"

interface EditInsurancePensionPageProps {
  params: Promise<{
    id: string
  }>
}

const defaultValues: InsurancePensionFormData = {
  name: "",
  member_id: "",
  notes: "",
  provider: "",
  contract_number: "",
  start_date: new Date(),
  guaranteed_interest: undefined,
  expected_return: undefined,
  contribution_plan_steps: [],
  statements: []
}

export default function EditInsurancePensionPage({ params }: EditInsurancePensionPageProps) {
  const router = useRouter()
  const { updateInsurancePensionWithStatement, createInsurancePensionStatement, updatePensionStatus } = usePension()
  const resolvedParams = use(params)
  const pensionId = parseInt(resolvedParams.id)
  const { data: pension, isLoading, error } = usePensionData<InsurancePension>(pensionId, PensionType.INSURANCE)
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  const form = useForm<InsurancePensionFormData>({
    resolver: zodResolver(insurancePensionSchema),
    defaultValues,
    mode: "onChange"
  })

  // Use the form reset hook
  useFormReset({
    data: pension,
    form,
    apiToForm: insurancePensionToForm,
    defaultValues
  })

  const handleSubmit = async (data: InsurancePensionFormData) => {
    try {
      // Format pension data
      const pensionData = {
        ...data,
        type: PensionType.INSURANCE,
        member_id: typeof data.member_id === 'string' ? parseInt(data.member_id) : data.member_id,
        start_date: toISODateString(data.start_date),
        notes: data.notes || ""
      }

      // Extract and format statements
      const statements = data.statements?.map(statement => ({
        id: statement.id,
        statement_date: toISODateString(statement.statement_date),
        value: typeof statement.value === 'string' ? parseFloat(statement.value) : statement.value,
        total_contributions: typeof statement.total_contributions === 'string' ? 
          parseFloat(statement.total_contributions) : statement.total_contributions,
        total_benefits: typeof statement.total_benefits === 'string' ? 
          parseFloat(statement.total_benefits) : statement.total_benefits,
        costs_amount: typeof statement.costs_amount === 'string' ? 
          parseFloat(statement.costs_amount) : statement.costs_amount,
        costs_percentage: typeof statement.costs_percentage === 'string' ? 
          parseFloat(statement.costs_percentage) : statement.costs_percentage,
        note: statement.note || "",
        projections: statement.projections?.map(proj => ({
          id: proj.id,
          scenario_type: proj.scenario_type,
          return_rate: typeof proj.return_rate === 'string' ? 
            parseFloat(proj.return_rate) : proj.return_rate,
          value_at_retirement: typeof proj.value_at_retirement === 'string' ? 
            parseFloat(proj.value_at_retirement) : proj.value_at_retirement,
          monthly_payout: typeof proj.monthly_payout === 'string' ? 
            parseFloat(proj.monthly_payout) : proj.monthly_payout
        }))
      })) || []

      // Separate existing and new statements
      const existingStatements = statements.filter(statement => typeof statement.id === 'number')
      const newStatements = statements.filter(statement => !statement.id)

      // First update the pension and existing statements
      if (existingStatements.length > 0) {
        await updateInsurancePensionWithStatement(
          pensionId,
          pensionData as unknown as Omit<InsurancePension, 'id' | 'current_value'>,
          existingStatements as Array<{
            id: number;
            statement_date: string;
            value: number;
            total_contributions: number;
            total_benefits: number;
            costs_amount: number;
            costs_percentage: number;
            note?: string;
            projections?: Array<{
              id?: number;
              scenario_type: 'with_contributions' | 'without_contributions';
              return_rate: number;
              value_at_retirement: number;
              monthly_payout: number;
            }>;
          }>
        )
      } else {
        // If no existing statements, just update the pension data
        await updateInsurancePensionWithStatement(
          pensionId,
          pensionData as unknown as Omit<InsurancePension, 'id' | 'current_value'>,
          []
        )
      }

      // Then create any new statements
      for (const statement of newStatements) {
        await createInsurancePensionStatement(
          pensionId,
          {
            statement_date: statement.statement_date,
            value: statement.value,
            total_contributions: statement.total_contributions,
            total_benefits: statement.total_benefits,
            costs_amount: statement.costs_amount,
            costs_percentage: statement.costs_percentage,
            note: statement.note,
            projections: statement.projections
          }
        )
      }

      toast.success("Success", { description: "Insurance pension updated successfully" })
      router.push(getPensionListRoute())
      router.refresh()
    } catch (error) {
      console.error('Failed to update pension:', error)
      if (error instanceof Error) {
        toast.error('Error', {
          description: error.message || 'Failed to update insurance pension'
        })
      } else {
        toast.error('Error', {
          description: 'Failed to update insurance pension'
        })
      }
    }
  }

  const handlePauseConfirm = async (pauseDate: Date) => {
    if (!pension) return

    try {
      await updatePensionStatus(pensionId, {
        status: 'PAUSED',
        paused_at: pauseDate.toISOString(),
      })
      setShowPauseDialog(false)
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
        resume_at: resumeDate.toISOString(),
      })
      setShowResumeDialog(false)
    } catch (error) {
      console.error('Error updating pension status:', error)
      toast.error('Error', {
        description: 'Failed to update pension status'
      })
    }
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Insurance Pension Plan</h1>
            <p className="text-muted-foreground mt-2">
              Update your insurance pension plan details.
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
            <Button type="submit" form="insurance-pension-form">
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
        ) : pension.type !== PensionType.INSURANCE ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Invalid pension type</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form id="insurance-pension-form" onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              console.error('Form validation errors:', errors)
              toast.error('Error', {
                description: 'Please fix the validation errors before submitting'
              })
            })}>
              <FormLayout>
                {/* Basic Information Section */}
                <FormSection
                  title="Basic Information"
                  description="Enter the basic details of your insurance pension plan"
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

                {/* Contribution Details Section */}
                <FormSection
                  title="Contribution Details"
                  description="Set up your contribution plan"
                  explanation={<ContributionDetailsExplanation />}
                >
                  <ContributionDetailsCard form={form} />
                </FormSection>

                {/* Statements Section */}
                <FormSection
                  title="Statements"
                  description="Track the performance of your pension plan"
                  explanation={<StatementsExplanation />}
                >
                  <StatementsCard form={form} pensionId={pensionId} />
                </FormSection>
              </FormLayout>
            </form>
          </Form>
        )}
      </div>
      
      {/* Dialogs */}
      {showPauseDialog && (
        <PauseConfirmationDialog
          open={showPauseDialog}
          onOpenChange={setShowPauseDialog}
          onConfirm={handlePauseConfirm}
        />
      )}
      {showResumeDialog && (
        <ResumeDateDialog
          open={showResumeDialog}
          onOpenChange={setShowResumeDialog}
          onConfirm={handleResumeConfirm}
        />
      )}
    </ErrorBoundary>
  )
} 