"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/frontend/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { useForm } from "react-hook-form"
import { usePension } from "@/frontend/context/pension"
import { Textarea } from "@/frontend/components/ui/textarea"
import { toast } from "sonner"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { CurrencyInput } from "@/frontend/components/shared/inputs/CurrencyInput"
import { DateInput } from "@/frontend/components/ui/date-input"

const formSchema = z.object({
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number"
  }).min(0.01, "Amount must be greater than 0"),
  contribution_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: "Please enter a valid date"
  }),
  note: z.string().optional()
})

interface YearlyInvestmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pensionId: number
  pensionName?: string
  onSuccess?: () => void
}

type YearlyInvestmentFormData = z.infer<typeof formSchema>

export function YearlyInvestmentModal({ 
  open, 
  onOpenChange, 
  pensionId,
  pensionName = "Company Pension",
  onSuccess
}: YearlyInvestmentModalProps) {
  const { createContributionHistory } = usePension()
  
  const form = useForm<YearlyInvestmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      contribution_date: new Date().toISOString().split('T')[0],
      note: ""
    }
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        amount: 0,
        contribution_date: new Date().toISOString().split('T')[0],
        note: ""
      })
    }
  }, [open, form])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const handleSubmit = async (data: YearlyInvestmentFormData) => {
    if (data.amount <= 0) {
      form.setError("amount", {
        type: "manual",
        message: "Amount must be greater than 0"
      })
      return
    }

    try {
      await createContributionHistory(pensionId, {
        amount: data.amount,
        date: data.contribution_date,
        is_manual: true,
        note: data.note && data.note.trim() !== "" ? data.note : undefined
      })
      toast.success("Success", {
        description: "Contribution added successfully"
      })
      handleClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to add contribution:', error)
      toast.error("Error", {
        description: "Failed to add contribution"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Contribution to {pensionName}</DialogTitle>
          <DialogDescription>
            This will add a manual contribution to the company pension.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      min={0.01}
                      placeholder="Enter amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contribution_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Date</FormLabel>
                  <FormControl>
                    <DateInput field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Add a note about this contribution..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                Add Contribution
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 