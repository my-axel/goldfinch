"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { AddETFPensionForm } from "@/frontend/components/pension/etf/forms/AddETFPensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { PensionType } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { zodResolver } from "@hookform/resolvers/zod"
import { etfPensionSchema } from "@/frontend/lib/validations/pension"

export default function NewETFPensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createEtfPension } = usePension()

  const form = useForm<ETFPensionFormData>({
    resolver: zodResolver(etfPensionSchema),
    defaultValues: {
      type: PensionType.ETF_PLAN,
      name: "",
      member_id: searchParams.get('member_id') || "",
      etf_id: "",
      contribution_plan_steps: []
    }
  })

  const handleSubmit = async (data: ETFPensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      await createEtfPension({
        type: PensionType.ETF_PLAN,
        name: data.name,
        member_id: memberId,
        etf_id: data.etf_id,
        is_existing_investment: data.is_existing_investment,
        existing_units: data.existing_units,
        reference_date: data.reference_date,
        contribution_plan_steps: data.contribution_plan_steps,
        realize_historical_contributions: data.initialization_method === "historical",
        status: "ACTIVE",
        total_units: data.is_existing_investment ? data.existing_units : 0
      })

      toast.success("Success", { description: "ETF pension created successfully" })
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
          <h1 className="text-3xl font-bold tracking-tight">Create ETF Pension Plan</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new ETF-based pension plan. You&apos;ll need to select an ETF
            and set up your contribution plan.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div>
              <AddETFPensionForm form={form} />
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