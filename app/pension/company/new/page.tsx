"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { AddCompanyPensionForm } from "@/frontend/components/pension/form/AddCompanyPensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { PensionType } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"
import { getPensionListRoute } from "@/frontend/lib/routes"

export default function NewCompanyPensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createCompanyPension } = usePension()

  const form = useForm<CompanyPensionFormData>({
    defaultValues: {
      type: PensionType.COMPANY,
      name: "",
      member_id: searchParams.get('member_id') || "",
      employer: "",
      start_date: new Date(),
      vesting_period: 0,
      initial_capital: 0,
      matching_percentage: 0,
      max_employer_contribution: 0,
      contribution_plan_steps: []
    }
  })

  const handleSubmit = async (data: CompanyPensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      await createCompanyPension({
        type: PensionType.COMPANY,
        name: data.name,
        member_id: memberId,
        employer: data.employer,
        start_date: data.start_date,
        vesting_period: data.vesting_period,
        matching_percentage: data.matching_percentage,
        max_employer_contribution: data.max_employer_contribution,
        contribution_plan_steps: data.contribution_plan_steps
      })

      toast.success("Success", { description: "Company pension created successfully" })
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
          <h1 className="text-3xl font-bold tracking-tight">Create Company Pension Plan</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new company pension plan. You&apos;ll need to provide employer information
            and set up your contribution plan.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div>
              <AddCompanyPensionForm form={form} />
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