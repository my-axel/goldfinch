"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { AddCompanyPensionForm } from "@/frontend/components/pension/company/forms/AddCompanyPensionForm"
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

export default function NewCompanyPensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createCompanyPension } = usePension()
  
  const memberId = searchParams?.get('member_id') || ""

  const form = useForm<CompanyPensionFormData>({
    defaultValues: {
      type: PensionType.COMPANY,
      name: "",
      member_id: memberId,
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
        status: 'ACTIVE',
        projections: data.projections && data.projections.length > 0 
          ? data.projections.map(projection => ({
              pension_id: -1, // Temporary ID, will be replaced by the backend
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column (8/12) - Form */}
        <div className="md:col-span-8 space-y-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center">
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
              className="space-y-8"
            >
              <AddCompanyPensionForm form={form} />
            </form>
          </Form>
        </div>

        {/* Right column (4/12) - Explanation */}
        <div className="md:col-span-4">
          <div className="sticky top-6 space-y-6">
            <Explanation>
              <ExplanationHeader>Creating a Company Pension</ExplanationHeader>
              <ExplanationContent>
                <p>
                  Enter the basic information about your company pension plan.
                  The contribution amount and frequency help you track your
                  regular investments.
                </p>
                <p className="mt-2">
                  Add the latest projection values from your company&apos;s pension 
                  statement to keep track of your expected retirement benefits.
                </p>
              </ExplanationContent>
              
              <ExplanationAlert className="mt-4">
                Regular updates to your pension information help you track your
                retirement progress more accurately.
              </ExplanationAlert>
              
              <ExplanationHeader className="mt-6">Key Information</ExplanationHeader>
              <ExplanationList>
                <ExplanationListItem>
                  <strong>Employer:</strong> The company providing the pension plan
                </ExplanationListItem>
                <ExplanationListItem>
                  <strong>Contribution Amount:</strong> Your regular contribution
                </ExplanationListItem>
                <ExplanationListItem>
                  <strong>Contribution Frequency:</strong> How often you contribute
                </ExplanationListItem>
                <ExplanationListItem>
                  <strong>Latest Statement Date:</strong> When you received your last statement
                </ExplanationListItem>
                <ExplanationListItem>
                  <strong>Projections:</strong> Expected retirement benefits based on your statement
                </ExplanationListItem>
              </ExplanationList>
            </Explanation>
          </div>
        </div>
      </div>
    </div>
  )
} 