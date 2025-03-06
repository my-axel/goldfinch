"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { PensionType, InsurancePension } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/pension"
import { toast } from "sonner"
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

export default function AddInsurancePensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createInsurancePension } = usePension()
  
  const memberId = searchParams?.get('member_id') || ""

  const form = useForm<InsurancePensionFormData>({
    resolver: zodResolver(insurancePensionSchema),
    defaultValues: {
      ...defaultValues,
      member_id: memberId
    }
  })

  const onSubmit = async (data: InsurancePensionFormData) => {
    try {
      await createInsurancePension({
        type: PensionType.INSURANCE,
        name: data.name,
        member_id: data.member_id,
        notes: data.notes,
        provider: data.provider,
        contract_number: data.contract_number,
        start_date: data.start_date,
        guaranteed_interest: data.guaranteed_interest,
        expected_return: data.expected_return,
        contribution_plan_steps: data.contribution_plan_steps,
        status: "ACTIVE",
        statements: data.statements
      } as unknown as Omit<InsurancePension, 'id' | 'current_value'>)

      toast.success('Success', {
        description: 'Insurance pension created successfully'
      })
      router.push(getPensionListRoute())
    } catch {
      toast.error('Error', {
        description: 'Failed to create insurance pension'
      })
    }
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Insurance Pension Plan</h1>
            <p className="text-muted-foreground mt-2">
              Set up a new insurance pension plan. You&apos;ll need to provide the insurance provider
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
            <Button type="submit" form="insurance-pension-form">
              Create Pension
            </Button>
          </div>
        </div>

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
                <StatementsCard form={form} />
              </div>
              <div className="md:col-span-4">
                <StatementsExplanation />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ErrorBoundary>
  )
} 