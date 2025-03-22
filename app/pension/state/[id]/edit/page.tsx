"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { StatePensionFormData } from "@/frontend/types/pension-form"
import { PensionType, StatePensionStatement } from "@/frontend/types/pension"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { statePensionSchema } from "@/frontend/lib/validations/pension"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { BasicInformationCard } from "@/frontend/components/pension/state/BasicInformationCard"
import { StatementsCard } from "@/frontend/components/pension/state/StatementsCard"
import { ScenarioViewer } from "@/frontend/components/pension/state/ScenarioViewer"
import { FormLayout, FormSection } from "@/frontend/components/shared"
import { BasicInformationExplanation } from "@/frontend/components/pension/state/explanations/BasicInformationExplanation"
import { StatementsExplanation } from "@/frontend/components/pension/state/explanations/StatementsExplanation"
import { ScenariosExplanation } from "@/frontend/components/pension/state/explanations/ScenariosExplanation"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { toISODateString } from "@/frontend/lib/dateUtils"
import React, { useState } from "react"
import { useStatePension, useUpdateStatePension, useUpdateStatePensionStatus } from "@/frontend/hooks/pension/useStatePensions"
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { statePensionToForm } from "@/frontend/lib/transformers/statePensionTransformers"
import { PensionStatusActions } from "@/frontend/components/pension/shared/PensionStatusActions"
import { PauseConfirmationDialog } from "@/frontend/components/pension/shared/dialogs/PauseConfirmationDialog"
import { ResumeDateDialog } from "@/frontend/components/pension/shared/dialogs/ResumeDateDialog"

interface EditStatePensionPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditStatePensionPage({ params }: EditStatePensionPageProps) {
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
  } = useStatePension(pensionId)
  
  const { mutateAsync: updatePension } = useUpdateStatePension()
  const { mutateAsync: updateStatus } = useUpdateStatePensionStatus()

  // Initialize form with the pension data once it's loaded
  const form = useForm<StatePensionFormData>({
    resolver: zodResolver(statePensionSchema),
    // We'll set default values when the pension data loads
    defaultValues: pension ? statePensionToForm(pension) : undefined
  })

  // Handle form submission
  const handleSubmit = async (data: StatePensionFormData) => {
    try {
      setIsSubmitting(true)
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      // Process statements to match StatePensionStatement[]
      const statements: StatePensionStatement[] = data.statements
        .filter(statement => statement.statement_date) // Only include statements with dates
        .map(statement => {
          // Create a valid statement object
          const processedStatement: StatePensionStatement = {
            pension_id: pensionId,
            statement_date: toISODateString(statement.statement_date),
            current_monthly_amount: statement.current_monthly_amount || undefined,
            projected_monthly_amount: statement.projected_monthly_amount || undefined,
            current_value: statement.current_value || undefined,
            note: statement.note || "",
            // Only include id if it exists and is a number
            id: statement.id || 0 // Must have an id as per StatePensionStatement
          }
          return processedStatement
        })

      // Create a pension data object that matches what the API expects
      const pensionData = {
        type: PensionType.STATE as const,
        name: data.name,
        member_id: memberId,
        start_date: toISODateString(data.start_date),
        notes: data.notes || "",
        status: data.status,
        statements
      }
      
      // Update the pension using React Query mutation
      await updatePension({ 
        id: pensionId, 
        data: pensionData 
      })
      
      toast.success("Success", { description: "State pension updated" })
      router.push(getPensionListRoute())
    } catch (error) {
      console.error("Error updating state pension:", error)
      toast.error("Error", { 
        description: error instanceof Error 
          ? error.message 
          : "Failed to update state pension" 
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
      toast.success("Success", { description: "State pension paused successfully" })
      setShowPauseDialog(false)
    } catch (error) {
      console.error("Error pausing state pension:", error)
      toast.error("Error", { 
        description: error instanceof Error 
          ? error.message 
          : "Failed to pause state pension" 
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
      toast.success("Success", { description: "State pension resumed successfully" })
      setShowResumeDialog(false)
    } catch (error) {
      console.error("Error resuming state pension:", error)
      toast.error("Error", { 
        description: error instanceof Error 
          ? error.message 
          : "Failed to resume state pension" 
      })
    }
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10">
        {/* Page header with title and buttons */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit State Pension</h1>
            <p className="text-muted-foreground mt-2">
              Update your state pension details and track your benefits over time.
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
              form="state-pension-form"
              disabled={isLoading || isSubmitting}
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
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        ) : !pension ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Pension not found</AlertDescription>
          </Alert>
        ) : pension.type !== undefined && pension.type !== PensionType.STATE ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Invalid pension type</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form 
              id="state-pension-form"
              onSubmit={form.handleSubmit(handleSubmit)} 
            >
              <FormLayout>
                {/* Basic Information Section */}
                <FormSection
                  title="Basic Information"
                  description="Keep your state pension details up to date"
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
                
                {/* Statements Section */}
                <FormSection
                  title="Pension Statements"
                  description="Record information from your state pension statements"
                  explanation={<StatementsExplanation />}
                >
                  <StatementsCard form={form} pensionId={pensionId} />
                </FormSection>

                {/* Scenarios Section */}
                <FormSection
                  title="Pension Scenarios"
                  description="View projections of future benefits based on retirement age and growth rates"
                  explanation={<ScenariosExplanation />}
                >
                  <ScenarioViewer pensionId={pensionId} />
                </FormSection>
              </FormLayout>
            </form>
          </Form>
        )}
      </div>

      {/* Replace the AlertDialogs with custom dialog components */}
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