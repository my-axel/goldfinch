"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { InsurancePensionForm } from "@/frontend/components/pension/form/InsurancePensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { FormData } from "@/frontend/types/pension-form"
import { PensionType } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"

export default function NewInsurancePensionPage() {
  const router = useRouter()
  const { createInsurancePension } = usePension()

  const form = useForm<FormData>({
    defaultValues: {
      type: PensionType.INSURANCE,
      name: "",
      member_id: "",
      initial_capital: 0,
      start_date: new Date(),
      // Insurance fields
      provider: "",
      contract_number: "",
      guaranteed_interest: 0,
      expected_return: 0,
      contribution_plan: [],
    }
  })

  const handleSubmit = async (data: FormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      await createInsurancePension({
        name: data.name,
        member_id: memberId,
        initial_capital: Number(data.initial_capital),
        start_date: data.start_date,
        type: PensionType.INSURANCE,
        provider: data.provider,
        contract_number: data.contract_number,
        guaranteed_interest: data.guaranteed_interest,
        expected_return: data.expected_return,
        contribution_plan: data.contribution_plan,
      })

      toast.success("Success", { description: "Insurance pension created successfully" })
      router.push("/pension")
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
            and insurance contract details.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="space-y-8 p-6 bg-card rounded-lg border">
              <InsurancePensionForm form={form} />
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