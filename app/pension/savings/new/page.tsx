"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { SavingsPensionFormData } from "@/frontend/types/pension-form"
import { PensionType, SavingsPension, CompoundingFrequency } from "@/frontend/types/pension"
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
import { useState, useMemo } from "react"
import { useCreateSavingsPension } from "@/frontend/hooks/useSavingsPensions"

export default function NewSavingsPensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: createPension } = useCreateSavingsPension()

  // Initialize form with default values
  const defaultValues = useMemo<SavingsPensionFormData>(() => ({
    type: PensionType.SAVINGS,
    name: "",
    member_id: searchParams.get('member_id') || "",
    start_date: new Date(),
    notes: "",
    
    // Default interest rates
    pessimistic_rate: 1.0,
    realistic_rate: 2.0,
    optimistic_rate: 3.0,
    
    // Default compounding frequency
    compounding_frequency: CompoundingFrequency.ANNUALLY,
    
    // Status and related data
    status: "ACTIVE",
    statements: [],
    contribution_plan_steps: []
  }), [searchParams]);

  const form = useForm<SavingsPensionFormData>({
    resolver: zodResolver(savingsPensionSchema),
    defaultValues
  })

  const handleSubmit = async (data: SavingsPensionFormData) => {
    try {
      setIsSubmitting(true)
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

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
        
        // Statements (convert dates to ISO strings)
        statements: data.statements.length > 0 
          ? data.statements.map(statement => ({
              statement_date: toISODateString(statement.statement_date),
              balance: statement.balance,
              note: statement.note || ""
            })) 
          : undefined,
        
        // Contribution plan steps (convert dates to ISO strings)
        contribution_plan_steps: data.contribution_plan_steps.length > 0
          ? data.contribution_plan_steps.map(step => ({
              amount: step.amount,
              frequency: step.frequency,
              start_date: toISODateString(step.start_date),
              end_date: step.end_date ? toISODateString(step.end_date) : undefined,
              note: step.note || ""
            }))
          : []
      }

      // Create the pension using React Query mutation
      await createPension(pensionData as unknown as Omit<SavingsPension, 'id'>)
      
      toast.success("Success", { description: "Savings pension created" })
      router.push(getPensionListRoute())
    } catch (error) {
      console.error("Error creating savings pension:", error)
      toast.error("Error", { 
        description: error instanceof Error 
          ? error.message 
          : "Failed to create savings pension" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10">
        {/* Page header with title and buttons */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0 sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Savings Pension</h1>
            <p className="text-muted-foreground mt-2">
              Create a savings-based pension plan to track your retirement savings account.
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
              disabled={isSubmitting}
            >
              Create Pension
            </Button>
          </div>
        </div>

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
                <StatementsCard form={form} />
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
      </div>
    </ErrorBoundary>
  )
} 