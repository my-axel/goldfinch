"use client"

import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { CompanyPensionForm } from "@/frontend/components/pension/form/CompanyPensionForm"
import { Form } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { FormData } from "@/frontend/types/pension-form"
import { PensionType } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/PensionContext"
import { toast } from "sonner"

export default function NewCompanyPensionPage() {
  const router = useRouter()
  const { createCompanyPension } = usePension()

  const form = useForm<FormData>({
    defaultValues: {
      type: PensionType.COMPANY,
      name: "",
      member_id: "",
      initial_capital: 0,
      start_date: new Date(),
      // Company fields
      employer: "",
      vesting_period: 0,
      matching_percentage: 0,
      max_employer_contribution: 0,
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

      await createCompanyPension({
        name: data.name,
        member_id: memberId,
        initial_capital: Number(data.initial_capital),
        start_date: data.start_date,
        type: PensionType.COMPANY,
        employer: data.employer,
        vesting_period: data.vesting_period,
        matching_percentage: data.matching_percentage,
        max_employer_contribution: data.max_employer_contribution,
        contribution_plan: data.contribution_plan,
      })

      toast.success("Success", { description: "Company pension created successfully" })
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
          <h1 className="text-3xl font-bold tracking-tight">Create Company Pension Plan</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new company pension plan. You&apos;ll need to provide basic information
            and employer contribution details.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="space-y-8 p-6 bg-card rounded-lg border">
              <CompanyPensionForm form={form} />
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