"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { StatePensionFormData } from "@/frontend/types/pension-form"
import { PensionType, StatePension } from "@/frontend/types/pension"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { statePensionSchema } from "@/frontend/lib/validations/pension"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { BasicInformationCard } from "@/frontend/components/pension/state/BasicInformationCard"
import { StatementsCard } from "@/frontend/components/pension/state/StatementsCard"
import { FormLayout, FormSection } from "@/frontend/components/shared"
import { BasicInformationExplanation } from "@/frontend/components/pension/state/explanations/BasicInformationExplanation"
import { StatementsExplanation } from "@/frontend/components/pension/state/explanations/StatementsExplanation"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { toISODateString } from "@/frontend/lib/dateUtils"
import { useState, useMemo } from "react"
import { useCreateStatePension } from "@/frontend/hooks/pension/useStatePensions"

export default function NewStatePensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: createPension } = useCreateStatePension()

  // Initialize form with default values
  const defaultValues = useMemo<StatePensionFormData>(() => ({
    type: PensionType.STATE,
    name: "",
    member_id: searchParams.get('member_id') || "",
    start_date: new Date(),
    notes: "",
    status: "ACTIVE",
    statements: []
  }), [searchParams]);

  const form = useForm<StatePensionFormData>({
    resolver: zodResolver(statePensionSchema),
    defaultValues
  })

  const handleSubmit = async (data: StatePensionFormData) => {
    try {
      setIsSubmitting(true)
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      // Create a pension data object that matches what the API expects
      const pensionData = {
        type: PensionType.STATE as const,
        name: data.name,
        member_id: memberId,
        start_date: toISODateString(data.start_date),
        notes: data.notes || "",
        status: data.status,
        // When creating a new pension, we don't need to pass statement IDs or pension_id
        // The backend will handle creating these relationships
        statements: data.statements.length > 0 ? data.statements.map(statement => ({
          statement_date: toISODateString(statement.statement_date),
          current_monthly_amount: statement.current_monthly_amount || null,
          projected_monthly_amount: statement.projected_monthly_amount || null,
          current_value: statement.current_value || null,
          note: statement.note || ""
        })) : undefined
      }

      // Create the pension using React Query mutation
      await createPension(pensionData as Omit<StatePension, 'id'>)
      
      toast.success("Success", { description: "State pension created" })
      router.push(getPensionListRoute())
    } catch (error) {
      console.error("Error creating state pension:", error)
      toast.error("Error", { 
        description: error instanceof Error 
          ? error.message 
          : "Failed to create state pension" 
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
            <h1 className="text-3xl font-bold tracking-tight">New State Pension</h1>
            <p className="text-muted-foreground mt-2">
              Add your state pension details and track your benefits over time.
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
              disabled={isSubmitting}
            >
              Create Pension
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form 
            id="state-pension-form"
            onSubmit={form.handleSubmit(handleSubmit)} 
          >
            <FormLayout>
              {/* Basic Information Section */}
              <FormSection
                title="Basic Information"
                description="Enter the basic details of your state pension"
                explanation={<BasicInformationExplanation />}
              >
                <BasicInformationCard form={form} />
              </FormSection>
              
              {/* Statements Section */}
              <FormSection
                title="Pension Statements"
                description="Record information from your state pension statements"
                explanation={<StatementsExplanation />}
              >
                <StatementsCard form={form} />
              </FormSection>
            </FormLayout>
          </form>
        </Form>
      </div>
    </ErrorBoundary>
  )
} 