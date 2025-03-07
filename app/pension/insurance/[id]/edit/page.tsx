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

interface EditInsurancePensionPageProps {
  params: Promise<{
    id: string
  }>
}

const defaultValues: InsurancePensionFormData = {
  type: PensionType.INSURANCE,
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
  const { updateInsurancePensionWithStatement } = usePension()
  const resolvedParams = use(params)
  const pensionId = parseInt(resolvedParams.id)
  const { data: pension, isLoading, error } = usePensionData<InsurancePension>(pensionId, PensionType.INSURANCE)

  const form = useForm<InsurancePensionFormData>({
    resolver: zodResolver(insurancePensionSchema),
    defaultValues
  })

  // Use the form reset hook
  useFormReset({
    data: pension,
    form,
    apiToForm: insurancePensionToForm,
    defaultValues
  })

  const onSubmit = async (data: InsurancePensionFormData) => {
    try {
      const { statements, ...pensionData } = data
      
      await updateInsurancePensionWithStatement(
        pensionId,
        {
          type: PensionType.INSURANCE,
          name: pensionData.name,
          member_id: pensionData.member_id,
          notes: pensionData.notes,
          provider: pensionData.provider,
          contract_number: pensionData.contract_number,
          start_date: pensionData.start_date,
          guaranteed_interest: pensionData.guaranteed_interest,
          expected_return: pensionData.expected_return,
          contribution_plan_steps: pensionData.contribution_plan_steps,
          status: pension?.status || "ACTIVE"
        } as unknown as Omit<InsurancePension, 'id' | 'current_value'>,
        statements.map(statement => ({
          id: statement.id!,
          statement_date: toISODateString(statement.statement_date),
          value: statement.value,
          total_contributions: statement.total_contributions,
          total_benefits: statement.total_benefits,
          costs_amount: statement.costs_amount,
          costs_percentage: statement.costs_percentage,
          note: statement.note,
          projections: statement.projections
        }))
      )

      toast.success('Success', {
        description: 'Insurance pension updated successfully'
      })
      router.push(getPensionListRoute())
    } catch {
      toast.error('Error', {
        description: 'Failed to update insurance pension'
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
            <form id="insurance-pension-form" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Basic Information Section */}
                <div className="md:col-span-8">
                  <BasicInformationCard form={form} />
                </div>
                <div className="md:col-span-4">
                  <BasicInformationExplanation />
                </div>

                {/* Contribution Details Section */}
                <div className="md:col-span-8">
                  <ContributionDetailsCard form={form} />
                </div>
                <div className="md:col-span-4">
                  <ContributionDetailsExplanation />
                </div>

                {/* Statements Section */}
                <div className="md:col-span-8">
                  <StatementsCard form={form} pensionId={pensionId} />
                </div>
                <div className="md:col-span-4">
                  <StatementsExplanation />
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </ErrorBoundary>
  )
} 