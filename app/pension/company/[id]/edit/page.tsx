"use client"

import { useForm } from "react-hook-form"
import { useRouter, useParams } from "next/navigation"
import { EditCompanyPensionForm } from "@/frontend/components/pension/company/forms/EditCompanyPensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, ContributionFrequency, CompanyPension } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
import { useEffect, useState } from "react"
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
import { ProjectionsCard } from "@/frontend/components/pension/company/components/ProjectionsCard"

interface EditCompanyPensionPageProps {
  params: {
    id: string
  }
}

export default function EditCompanyPensionPage({ params: serverParams }: EditCompanyPensionPageProps) {
  // Use the useParams hook to get the client-side params
  const clientParams = useParams<{ id: string }>()
  
  // Use the id from either client or server params
  const id = clientParams?.id || serverParams.id
  const pensionId = parseInt(id)
  
  const router = useRouter()
  const { selectedPension, fetchPension, updateCompanyPension } = usePension()
  const [hasFetched, setHasFetched] = useState(false)

  const form = useForm<CompanyPensionFormData>({
    defaultValues: {
      type: PensionType.COMPANY,
      name: "",
      member_id: "",
      employer: "",
      start_date: new Date(),
      contribution_amount: undefined,
      contribution_frequency: ContributionFrequency.MONTHLY,
      latest_statement_date: undefined,
      notes: "",
      contribution_plan_steps: [],
      projections: []
    }
  })

  // Only fetch the pension once when the component mounts
  useEffect(() => {
    if (!hasFetched && pensionId) {
      fetchPension(pensionId, PensionType.COMPANY).then(() => {
        setHasFetched(true)
      }).catch(error => {
        console.error("Failed to fetch pension:", error);
        setHasFetched(true); // Mark as fetched even on error to prevent infinite retries
      });
    }
  }, [fetchPension, pensionId, hasFetched]);

  // Only update the form when selectedPension changes
  useEffect(() => {
    if (selectedPension && selectedPension.type === PensionType.COMPANY) {
      // Create a deep copy of projections to avoid reference issues
      const projectionsCopy = selectedPension.projections ? 
        selectedPension.projections.map(projection => ({
          retirement_age: projection.retirement_age,
          monthly_payout: projection.monthly_payout,
          total_capital: projection.total_capital
        })) : [];

      // Create a deep copy of contribution steps to avoid reference issues
      const contributionStepsCopy = selectedPension.contribution_plan_steps.map(step => ({
        amount: step.amount,
        frequency: step.frequency,
        start_date: new Date(step.start_date),
        end_date: step.end_date ? new Date(step.end_date) : undefined,
        note: step.note
      }));

      form.reset({
        type: PensionType.COMPANY,
        name: selectedPension.name,
        member_id: selectedPension.member_id.toString(),
        employer: selectedPension.employer,
        start_date: new Date(selectedPension.start_date),
        contribution_amount: selectedPension.contribution_amount,
        contribution_frequency: selectedPension.contribution_frequency || ContributionFrequency.MONTHLY,
        latest_statement_date: selectedPension.latest_statement_date ? new Date(selectedPension.latest_statement_date) : undefined,
        notes: selectedPension.notes || "",
        contribution_plan_steps: contributionStepsCopy,
        projections: projectionsCopy
      });
    }
  }, [selectedPension, form]);

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
        latest_statement_date: data.latest_statement_date ? data.latest_statement_date.toISOString().split('T')[0] : null,
        notes: data.notes || "",
        contribution_plan_steps: data.contribution_plan_steps.map(step => ({
          amount: typeof step.amount === 'string' ? parseFloat(step.amount) : step.amount,
          frequency: step.frequency,
          start_date: step.start_date.toISOString().split('T')[0],
          end_date: step.end_date ? step.end_date.toISOString().split('T')[0] : null,
          note: step.note || null
        })),
        status: selectedPension?.status || "ACTIVE",
        projections: data.projections && data.projections.length > 0 
          ? data.projections.map(projection => ({
              pension_id: pensionId,
              retirement_age: typeof projection.retirement_age === 'string' ? 
                parseInt(projection.retirement_age) : projection.retirement_age,
              monthly_payout: typeof projection.monthly_payout === 'string' ? 
                parseFloat(projection.monthly_payout) : projection.monthly_payout,
              total_capital: typeof projection.total_capital === 'string' ? 
                parseFloat(projection.total_capital) : projection.total_capital
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

  if (!selectedPension) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading pension details...</p>
        </div>
      </div>
    )
  }

  if (selectedPension.type !== PensionType.COMPANY) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Invalid pension type</p>
        </div>
      </div>
    )
  }

  return (
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
              >
                Save Changes
              </Button>
            </div>
          </div>

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
          <ContributionHistoryCard pension={selectedPension} />
          
          {/* Projections Card */}
          <ProjectionsCard pension={selectedPension} />
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
  )
} 