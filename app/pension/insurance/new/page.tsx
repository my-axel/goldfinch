"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { AddInsurancePensionForm } from "@/frontend/components/pension/form/AddInsurancePensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { PensionType } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
import { getPensionListRoute } from "@/frontend/lib/routes"

export default function NewInsurancePensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createInsurancePension } = usePension()

  const form = useForm<InsurancePensionFormData>({
    defaultValues: {
      type: PensionType.INSURANCE,
      name: "",
      member_id: searchParams.get('member_id') || "",
      provider: "",
      contract_number: "",
      start_date: new Date(),
      initial_capital: 0,
      guaranteed_interest: 0,
      expected_return: 0,
      contribution_plan_steps: []
    }
  })

  const handleSubmit = async (data: InsurancePensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      await createInsurancePension({
        type: PensionType.INSURANCE,
        name: data.name,
        member_id: memberId,
        provider: data.provider,
        contract_number: data.contract_number,
        start_date: data.start_date,
        initial_capital: data.initial_capital,
        guaranteed_interest: data.guaranteed_interest,
        expected_return: data.expected_return,
        contribution_plan_steps: data.contribution_plan_steps
      })

      toast.success("Success", { description: "Insurance pension created successfully" })
      router.push(getPensionListRoute())
      router.refresh()
    } catch (error) {
      console.error('Failed to create pension:', error)
      // Error is handled by the context
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Insurance Pension Plan</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new insurance-based pension plan. You&apos;ll need to provide basic information
            and set up your contribution plan.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div>
              <AddInsurancePensionForm form={form} />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Pension
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 