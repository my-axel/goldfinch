"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { EditETFPensionBasicInformationForm } from "@/frontend/components/pension/form/EditETFPensionBasicInformationForm"
import { EditETFPensionContributionStepsForm } from "@/frontend/components/pension/form/EditETFPensionContributionStepsForm"
import { ETFPensionStats } from "@/frontend/components/pension/ETFPensionStats"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, type ETFPension } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { useHousehold } from "@/frontend/context/HouseholdContext"
import { toast } from "sonner"
import { use } from "react"
import { useEffect, useState } from "react"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { Skeleton } from "@/frontend/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { ContributionHistoryChart, ValueDevelopmentChart, PerformanceMetricsChart } from "@/frontend/components/charts"

interface EditETFPensionPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditETFPensionPage({ params }: EditETFPensionPageProps) {
  const router = useRouter()
  const { 
    selectedPension: pension, 
    fetchPension, 
    updateEtfPension, 
    isLoading,
    pensionStatistics,
    isLoadingStatistics,
    fetchPensionStatistics
  } = usePension()
  const { members, fetchMembers } = useHousehold()
  const [hasFetched, setHasFetched] = useState(false)
  const resolvedParams = use(params)
  const pensionId = parseInt(resolvedParams.id)
  const statistics = pensionStatistics[pensionId]
  const isLoadingCurrentStatistics = isLoadingStatistics[pensionId]

  // Get the member's retirement date
  const member = pension ? members.find(m => m.id === pension.member_id) : null
  const retirementDate = member ? new Date(member.retirement_date_planned) : undefined

  const form = useForm<ETFPensionFormData>({
    defaultValues: {
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
    }
  })

  // Fetch both pension and members data when component mounts
  useEffect(() => {
    if (!hasFetched) {
      Promise.all([
        fetchPension(pensionId),
        fetchMembers()
      ]).then(() => {
        setHasFetched(true)
      }).catch((error) => {
        console.error('Failed to fetch initial data:', error)
        toast.error("Error", { description: "Failed to load pension data" })
      })
    }
  }, [fetchPension, fetchMembers, pensionId, hasFetched])

  // Fetch statistics when pension is loaded
  useEffect(() => {
    if (pension && !statistics && !isLoadingStatistics) {
      fetchPensionStatistics(pensionId)
    }
  }, [pension, statistics, isLoadingStatistics, fetchPensionStatistics, pensionId])

  // Update form when pension data changes
  useEffect(() => {
    if (pension && pension.type === PensionType.ETF_PLAN) {
      form.reset({
        type: PensionType.ETF_PLAN,
        name: pension.name,
        member_id: pension.member_id.toString(),
        notes: pension.notes,
        etf_id: pension.etf_id,
        is_existing_investment: pension.is_existing_investment,
        existing_units: pension.existing_units || 0,
        reference_date: pension.reference_date || new Date(),
        realize_historical_contributions: pension.realize_historical_contributions || false,
        initialization_method: "none",
        contribution_plan_steps: pension.contribution_plan_steps.map(step => ({
          amount: step.amount,
          frequency: step.frequency,
          start_date: new Date(step.start_date),
          end_date: step.end_date ? new Date(step.end_date) : undefined,
          note: step.note
        }))
      })
    }
  }, [pension, form])

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

      // Transform contribution steps to ensure all fields are properly included
      const contribution_plan_steps = data.contribution_plan_steps.map(step => ({
        amount: step.amount,
        frequency: step.frequency,
        start_date: step.start_date,
        end_date: step.end_date || undefined,
        note: step.note || undefined
      }))

      const payload = {
        type: PensionType.ETF_PLAN as const,
        name: data.name,
        member_id: memberId,
        notes: data.notes,
        etf_id: data.etf_id,
        is_existing_investment: data.is_existing_investment,
        existing_units: data.existing_units,
        reference_date: data.reference_date,
        contribution_plan_steps,
        realize_historical_contributions: data.initialization_method === "historical",
        total_units: (pension as ETFPension).total_units,
        status: pension.status,
        paused_at: pension.paused_at,
        resume_at: pension.resume_at
      }

      await updateEtfPension(pensionId, payload)

      toast.success("Success", { description: "ETF pension updated successfully" })
      router.push(getPensionListRoute())
      router.refresh()
    } catch (error) {
      console.error('Failed to update pension:', error)
      // Error is handled by the context
    }
  }

  return (
    <div className="container py-10">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit ETF Pension Plan</h1>
            <p className="text-muted-foreground mt-2">
              Update your ETF-based pension plan details and contribution schedule.
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="etf-pension-form"
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="etf-pension-form" onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Main Content */}
            <div className="space-y-6">
              {/* First Row: Basic Information and Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  {isLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : (
                    <EditETFPensionBasicInformationForm form={form} />
                  )}
                </div>
                <div className="lg:col-span-5">
                  <ETFPensionStats pensionId={pensionId} />
                </div>
              </div>

              {/* Second Row: Contribution Plan and Historical Contributions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  {isLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <EditETFPensionContributionStepsForm form={form} />
                  )}
                </div>
                <div className="lg:col-span-5">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle>Historical Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-[200px] w-full" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <ContributionHistoryChart
                            data={statistics?.contribution_history || []}
                            contributionPlan={form.watch('contribution_plan_steps')}
                            retirementDate={retirementDate}
                            isLoading={isLoadingCurrentStatistics}
                            height={300}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Third Row: Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-[200px] w-full" />
                        </div>
                      ) : (
                        <div className="space-y-4">

                          <ValueDevelopmentChart
                            data={statistics?.value_history || []}
                            isLoading={isLoadingCurrentStatistics}
                            height={300}
                          />
                          <PerformanceMetricsChart
                            totalInvestedAmount={statistics?.total_invested_amount || 0}
                            currentValue={statistics?.current_value || 0}
                            totalReturn={statistics?.total_return || 0}
                            annualReturn={statistics?.annual_return}
                            isLoading={isLoadingCurrentStatistics}
                            height={300}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 