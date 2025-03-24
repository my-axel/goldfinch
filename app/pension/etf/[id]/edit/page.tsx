"use client"

import { useForm, useWatch } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, type ETFPension } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/pension"
import { useHouseholdMembers } from "@/frontend/hooks/useHouseholdMembers"
import { toast } from "sonner"
import { use } from "react"
import { useEffect, useState, useMemo } from "react"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { Skeleton } from "@/frontend/components/ui/skeleton"
import {
  CombinedProjectionChart,
  HistoricalPerformanceChart
} from "@/frontend/components/charts"
import { useProjectionScenarios } from "@/frontend/hooks/useProjectionScenarios"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { LoadingState } from "@/frontend/components/shared/LoadingState"
import { Alert, AlertTitle, AlertDescription } from "@/frontend/components/ui/alert"
import { FormLayout, FormSection } from "@/frontend/components/shared"
import { BasicInformationCard } from "@/frontend/components/pension/etf/BasicInformationCard"
import { ContributionPlanCard } from "@/frontend/components/pension/etf/ContributionPlanCard"
import { PensionStatusActions } from "@/frontend/components/pension/shared/PensionStatusActions"
import { PauseConfirmationDialog } from "@/frontend/components/pension/shared/dialogs/PauseConfirmationDialog"
import { ResumeDateDialog } from "@/frontend/components/pension/shared/dialogs/ResumeDateDialog"
import { ValueProjectionExplanation } from "@/frontend/components/pension/etf/explanations/ValueProjectionExplanation"
import { HistoricalPerformanceExplanation } from "@/frontend/components/pension/etf/explanations/HistoricalPerformanceExplanation"
import { ContributionPlanExplanation } from "@/frontend/components/pension/etf/explanations/ContributionPlanExplanation"
import { TrendingUp } from "lucide-react"
import { toISODateString } from "@/frontend/lib/dateUtils"
import { usePensionData } from "@/frontend/lib/hooks/usePensionData"
import { useFormReset } from "@/frontend/lib/hooks/useFormReset"
import { etfPensionToForm } from "@/frontend/lib/transformers/etfPensionTransformers"

interface EditETFPensionPageProps {
  params: Promise<{
    id: string
  }>
}

// Form transformation for submission - keep this as it's for form to API transformation
const transformFormDataToPension = (data: ETFPensionFormData, currentPension: ETFPension): Omit<ETFPension, "id" | "current_value"> => ({
  type: PensionType.ETF_PLAN,
  name: data.name,
  member_id: parseInt(data.member_id),
  notes: data.notes,
  etf_id: data.etf_id,
  is_existing_investment: data.is_existing_investment,
  existing_units: data.existing_units,
  reference_date: data.reference_date,
  contribution_plan_steps: data.contribution_plan_steps.map(step => ({
    amount: step.amount,
    frequency: step.frequency,
    start_date: step.start_date,
    end_date: step.end_date || undefined,
    note: step.note || undefined
  })),
  realize_historical_contributions: data.initialization_method === "historical",
  total_units: currentPension.total_units,
  status: currentPension.status,
  paused_at: currentPension.paused_at,
  resume_at: currentPension.resume_at
})

export default function EditETFPensionPage({ params }: EditETFPensionPageProps) {
  const router = useRouter()
  const { 
    updateEtfPension, 
    pensionStatistics,
    isLoadingStatistics,
    fetchPensionStatistics,
    updatePensionStatus
  } = usePension()
  const { data: members = [] } = useHouseholdMembers()
  const resolvedParams = use(params)
  const pensionId = parseInt(resolvedParams.id)
  const { data: pension, isLoading, error } = usePensionData<ETFPension>(pensionId, PensionType.ETF_PLAN)
  const statistics = pensionStatistics[pensionId]
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  // Get the member's retirement date
  const member = pension ? members.find(m => m.id === pension.member_id) : null
  const retirementDate = member ? new Date(member.retirement_date_planned) : undefined

  // Extract defaultValues to a stable reference using useMemo
  const stableDefaultValues = useMemo(() => ({
    type: PensionType.ETF_PLAN,
    name: "",
    member_id: "",
    notes: "",
    etf_id: "",
    is_existing_investment: false,
    existing_units: 0,
    reference_date: new Date(),
    realize_historical_contributions: false,
    initialization_method: "none",
    contribution_plan_steps: []
  }) as ETFPensionFormData, []); // Empty dependency array for stable reference

  // Use this stable reference in both the form and hook
  const form = useForm<ETFPensionFormData>({
    defaultValues: stableDefaultValues
  });

  // Use the form reset hook instead of manual reset
  useFormReset<ETFPension, ETFPensionFormData>({
    data: pension,
    form,
    apiToForm: etfPensionToForm,
    defaultValues: stableDefaultValues
  })

  // Use useWatch to get stable value for contribution_plan_steps
  const contributionPlanSteps = useWatch({
    control: form.control,
    name: "contribution_plan_steps",
    defaultValue: []
  })

  // Use the projection scenarios hook with stable contributionPlanSteps
  const { scenarios } = useProjectionScenarios({
    historicalData: statistics?.value_history?.map(point => ({
      date: new Date(point.date),
      value: parseFloat(point.value.toString()),
      isProjection: false
    })) || [],
    contributionSteps: contributionPlanSteps,
    retirementDate: retirementDate || new Date(),
    historicalContributions: statistics?.contribution_history || []
  })

  // Unified loading state
  const loadingState = {
    isPageLoading: isLoading,
    isStatisticsLoading: isLoadingStatistics[pensionId] || false,
    isAnyLoading: isLoading || isLoadingStatistics[pensionId] || false
  }

  // Unified error handler
  const handleError = (error: unknown, action: string) => {
    console.error(`Failed to ${action}:`, error)
    toast.error("Error", { 
      description: `Failed to ${action}. Please try again.`
    })
  }

  // Separate effect for fetching statistics after pension is loaded
  useEffect(() => {
    if (!pension || pension.type !== PensionType.ETF_PLAN) return;
    
    const loadStatistics = async () => {
      try {
        await fetchPensionStatistics(pensionId, PensionType.ETF_PLAN);
      } catch (statsError) {
        console.warn("Failed to fetch pension statistics:", statsError);
        // Don't fail the entire page load if statistics can't be fetched
      }
    };
    
    loadStatistics();
  }, [pension, pensionId, fetchPensionStatistics]);

  const handleSubmit = async (data: ETFPensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      if (!pension || pension.type !== PensionType.ETF_PLAN) {
        toast.error("Error", { description: "ETF Pension not found" })
        return
      }

      const payload = transformFormDataToPension(data, pension)
      await updateEtfPension(pensionId, payload)

      toast.success("Success", { description: "ETF pension updated successfully" })
      router.push(getPensionListRoute())
      router.refresh()
    } catch (error) {
      handleError(error, "update pension")
    }
  }

  const handlePauseConfirm = async (pauseDate: Date) => {
    if (!pension) return

    try {
      await updatePensionStatus(pensionId, {
        status: 'PAUSED',
        paused_at: toISODateString(pauseDate)
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
        resume_at: toISODateString(resumeDate)
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
            <h1 className="text-3xl font-bold tracking-tight">Edit ETF Pension Plan</h1>
            <p className="text-muted-foreground mt-2">
              Update your ETF-based pension plan details and contribution schedule.
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
            <Button type="submit" form="etf-pension-form" disabled={loadingState.isAnyLoading}>
              Save Changes
            </Button>
          </div>
        </div>

        {loadingState.isPageLoading ? (
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
        ) : pension.type !== PensionType.ETF_PLAN ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Invalid pension type</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form id="etf-pension-form" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormLayout>
                {/* Basic Information Section */}
                <FormSection
                  title="Basic Information"
                  description="Enter the basic details of your ETF pension plan"
                  headerActions={
                    <PensionStatusActions
                      status={pension.status}
                      onPause={() => setShowPauseDialog(true)}
                      onResume={() => setShowResumeDialog(true)}
                    />
                  }
                >
                  <BasicInformationCard form={form} isEditing={true} />
                </FormSection>

                {/* Contribution Plan Section */}
                <FormSection
                  title="Contribution Plan"
                  description="Set up your contribution schedule"
                  explanation={<ContributionPlanExplanation form={form} retirementDate={retirementDate} />}
                  explanationTitle={
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" /> 
                      <span>Growth Opportunity</span>
                    </div>
                  }
                >
                  <ContributionPlanCard form={form} memberId={form.watch('member_id')} />
                </FormSection>

                {/* Historical Performance Section */}
                <FormSection
                  title="Historical Performance"
                  description="Track the performance of your pension plan"
                  explanation={<HistoricalPerformanceExplanation pensionId={pensionId} />}
                  explanationTitle="Historical Statistics"
                >
                  {loadingState.isStatisticsLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : statistics?.value_history && statistics.value_history.length > 0 ? (
                    <HistoricalPerformanceChart
                      contributionData={statistics.contribution_history}
                      valueData={statistics.value_history.map(point => ({
                        date: new Date(point.date),
                        value: parseFloat(point.value.toString())
                      }))}
                      asCard={false}
                    />
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No historical data available
                    </div>
                  )}
                </FormSection>

                {/* Value Projection Section */}
                <FormSection
                  title="Value Projection"
                  description="Projected future value of your pension plan"
                  explanation={
                    !loadingState.isStatisticsLoading && (
                      <ValueProjectionExplanation
                        scenarios={scenarios?.scenarios || {
                          pessimistic: { type: 'pessimistic', dataPoints: [], finalValue: 0, totalContributions: 0, totalReturns: 0, returnRate: 2 },
                          realistic: { type: 'realistic', dataPoints: [], finalValue: 0, totalContributions: 0, totalReturns: 0, returnRate: 5 },
                          optimistic: { type: 'optimistic', dataPoints: [], finalValue: 0, totalContributions: 0, totalReturns: 0, returnRate: 8 }
                        }}
                      />
                    )
                  }
                  explanationTitle="Scenario Analysis"
                >
                  {loadingState.isStatisticsLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : contributionPlanSteps.length > 0 ? (
                    <CombinedProjectionChart
                      data={(statistics?.value_history || []).map(point => ({
                        date: new Date(point.date),
                        value: parseFloat(point.value.toString()),
                        isProjection: false
                      }))}
                      contributionData={statistics?.contribution_history || []}
                      contributionSteps={contributionPlanSteps}
                      timeRange={{
                        start: statistics?.value_history && statistics.value_history.length > 0 
                          ? new Date(statistics.value_history[0].date) 
                          : new Date(),
                        end: retirementDate || new Date()
                      }}
                      height={600}
                      expandable={false}
                      asCard={false}
                    />
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No projection data available
                    </div>
                  )}
                </FormSection>
              </FormLayout>
            </form>
          </Form>
        )}

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
      </div>
    </ErrorBoundary>
  )
} 