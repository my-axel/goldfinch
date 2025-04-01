"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { SavingsPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, SavingsPension, SavingsPensionStatement } from "@/frontend/types/pension"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { savingsPensionSchema } from "@/frontend/lib/validations/pension"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { BasicInformationCard } from "@/frontend/components/pension/savings/BasicInformationCard"
import { InterestRatesCard } from "@/frontend/components/pension/savings/InterestRatesCard"
import { StatementsCard } from "@/frontend/components/pension/savings/StatementsCard"
import { ContributionPlanCard } from "@/frontend/components/pension/savings/ContributionPlanCard"
import { FormLayout, FormSection } from "@/frontend/components/shared"
import { BasicInformationExplanation } from "@/frontend/components/pension/savings/explanations/BasicInformationExplanation"
import { InterestRatesExplanation } from "@/frontend/components/pension/savings/explanations/InterestRatesExplanation"
import { StatementsExplanation } from "@/frontend/components/pension/savings/explanations/StatementsExplanation"
import { ContributionPlanExplanation } from "@/frontend/components/pension/savings/explanations/ContributionPlanExplanation"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { toISODateString } from "@/frontend/lib/dateUtils"
import React, { useState, useEffect, useMemo } from "react"
import { useSavingsPension, useUpdateSavingsPension, useUpdateSavingsPensionStatus } from "@/frontend/hooks/useSavingsPensions"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { savingsPensionToForm } from "@/frontend/lib/transformers/savingsPensionTransformers"
import { PensionStatusActions } from "@/frontend/components/pension/shared/PensionStatusActions"
import { PauseConfirmationDialog } from "@/frontend/components/pension/shared/dialogs/PauseConfirmationDialog"
import { ResumeDateDialog } from "@/frontend/components/pension/shared/dialogs/ResumeDateDialog"

interface EditSavingsPensionPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditSavingsPensionPage({ params }: EditSavingsPensionPageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const pensionId = parseInt(resolvedParams.id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  
  // Use React Query hook to fetch pension data
  const { 
    data: pension,
    isLoading,
    error
  } = useSavingsPension(pensionId)
  
  const { mutateAsync: updatePension } = useUpdateSavingsPension(pensionId)
  const { mutateAsync: updateStatus } = useUpdateSavingsPensionStatus()

  // Unified loading state for consistency
  const loadingState = useMemo(() => ({
    isPageLoading: isLoading,
    isSubmitting,
    isAnyLoading: isLoading || isSubmitting
  }), [isLoading, isSubmitting]);

  // Helper function to check if pension is of SAVINGS type
  const isPensionTypeValid = useMemo(() => {
    // Always show loading state if we're still loading pension data
    if (loadingState.isPageLoading) return true;
    
    // If pension data is loaded but null, there's a real issue
    if (!pension) return false;
    
    // Special case: If type is an empty string on page refresh, treat it as valid
    if (!pension.type || String(pension.type).trim() === "") return true;
    
    // Normal case: Compare the types
    return String(pension.type) === String(PensionType.SAVINGS);
  }, [pension, loadingState.isPageLoading]);

  // Initialize form with the pension data once it's loaded
  const form = useForm<SavingsPensionFormData>({
    resolver: zodResolver(savingsPensionSchema),
    // We'll set default values when the pension data loads
    defaultValues: pension ? savingsPensionToForm(pension) : undefined
  })

  // Update form data when pension data loads
  useEffect(() => {
    if (pension) {
      const formData = savingsPensionToForm(pension)
      form.reset(formData) // This reinitializes the form with the data
    }
  }, [pension, form])

  // Handle form submission
  const handleSubmit = async (data: SavingsPensionFormData) => {
    try {
      setIsSubmitting(true)
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      // Process statements to match SavingsPensionStatement[]
      const statements: SavingsPensionStatement[] = data.statements
        .filter(statement => statement.statement_date) // Only include statements with dates
        .map(statement => {
          // Create a valid statement object
          const processedStatement: SavingsPensionStatement = {
            pension_id: pensionId,
            statement_date: toISODateString(statement.statement_date),
            balance: statement.balance,
            note: statement.note || "",
            // Only include id if it exists and is a number
            id: statement.id || 0
          }
          return processedStatement
        })

      // Create a pension data object that matches what the API expects
      const pensionData = {
        type: PensionType.SAVINGS as const,
        name: data.name,
        member_id: memberId,
        start_date: toISODateString(data.start_date),
        notes: data.notes || "",
        
        // Interest rates
        pessimistic_rate: data.pessimistic_rate,
        realistic_rate: data.realistic_rate,
        optimistic_rate: data.optimistic_rate,
        
        // Compounding frequency
        compounding_frequency: data.compounding_frequency,
        
        // Status
        status: data.status,
        
        // Statements (already processed above)
        statements: statements,
        
        // Contribution plan steps (convert dates to ISO strings)
        contribution_plan_steps: data.contribution_plan_steps.map(step => ({
          amount: step.amount,
          frequency: step.frequency,
          start_date: toISODateString(step.start_date),
          end_date: step.end_date ? toISODateString(step.end_date) : undefined,
          note: step.note || ""
        }))
      }
      
      // Update the pension using React Query mutation
      await updatePension(pensionData as unknown as Partial<SavingsPension>)
      
      toast.success("Success", { description: "Savings pension updated" })
      router.push(getPensionListRoute())
    } catch (error) {
      console.error("Error updating savings pension:", error)
      toast.error("Error", { 
        description: error instanceof Error 
          ? error.message 
          : "Failed to update savings pension" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle status changes
  const handlePauseConfirm = async (pauseDate: Date) => {
    try {
      await updateStatus({
        pensionId,
        statusData: {
          status: 'PAUSED',
          paused_at: toISODateString(pauseDate)
        }
      })
      toast.success("Success", { description: "Savings pension paused successfully" })
      setShowPauseDialog(false)
    } catch (error) {
      console.error("Error pausing savings pension:", error)
      toast.error("Error", { 
        description: error instanceof Error 
          ? error.message 
          : "Failed to pause savings pension" 
      })
    }
  }

  const handleResumeConfirm = async (resumeDate: Date) => {
    try {
      await updateStatus({
        pensionId,
        statusData: {
          status: 'ACTIVE',
          resume_at: toISODateString(resumeDate)
        }
      })
      toast.success("Success", { description: "Savings pension resumed successfully" })
      setShowResumeDialog(false)
    } catch (error) {
      console.error("Error resuming savings pension:", error)
      toast.error("Error", { 
        description: error instanceof Error 
          ? error.message 
          : "Failed to resume savings pension" 
      })
    }
  }

  return (
    <ErrorBoundary>
      <div className="container">
        {/* Page header with title and buttons */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Savings Pension</h1>
            <p className="text-muted-foreground mt-2">
              Update your savings account details and track your retirement savings over time.
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
              form="savings-pension-form"
              disabled={loadingState.isAnyLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {loadingState.isPageLoading ? (
          <LoadingState message="Loading pension details..." />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        ) : !pension ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Pension not found</AlertDescription>
          </Alert>
        ) : !isPensionTypeValid ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Invalid pension type: &ldquo;{pension.type}&rdquo; (expected: &ldquo;{PensionType.SAVINGS}&rdquo;)
            </AlertDescription>
          </Alert>
        ) :
          <Form {...form}>
            <form 
              id="savings-pension-form"
              onSubmit={form.handleSubmit(handleSubmit)} 
            >
              <FormLayout>
                {/* Basic Information Section */}
                <FormSection
                  title="Basic Information"
                  description="Enter the basic details of your savings account"
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
                
                {/* Interest Rates Section */}
                <FormSection
                  title="Interest Rates"
                  description="Configure interest rates for different scenarios"
                  explanation={<InterestRatesExplanation />}
                >
                  <InterestRatesCard form={form} />
                </FormSection>
                
                {/* Statements Section */}
                <FormSection
                  title="Account Statements"
                  description="Record your savings account balance over time"
                  explanation={<StatementsExplanation />}
                >
                  <StatementsCard form={form} pensionId={pensionId} />
                </FormSection>
                
                {/* Contribution Plan Section */}
                <FormSection
                  title="Contribution Plan"
                  description="Set up your regular deposits to this savings account"
                  explanation={<ContributionPlanExplanation />}
                >
                  <ContributionPlanCard form={form} />
                </FormSection>
              </FormLayout>
            </form>
          </Form>
        }
      </div>

      {/* Dialog components */}
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
    </ErrorBoundary>
  )
} 