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
import { NumberInput } from "@/frontend/components/shared/inputs/NumberInput"
import { DateInput } from "@/frontend/components/ui/date-input"
import { toISODateString } from "@/frontend/lib/dateUtils"

const formSchema = z.object({
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number"
  }).min(0.01, "Amount must be greater than 0"),
  investment_date: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: "Please enter a valid date"
  }),
  note: z.string().optional()
})

interface OneTimeInvestmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pensionId: number
  pensionName: string
}

type OneTimeInvestmentFormData = z.infer<typeof formSchema>

export function OneTimeInvestmentModal({ 
  open, 
  onOpenChange, 
  pensionId,
  pensionName 
}: OneTimeInvestmentModalProps) {
  const { addOneTimeInvestment } = usePension()
  
  const form = useForm<OneTimeInvestmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      investment_date: toISODateString(new Date()),
      note: ""
    }
  })

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const handleSubmit = async (data: OneTimeInvestmentFormData) => {
    if (data.amount <= 0) {
      form.setError("amount", {
        type: "manual",
        message: "Amount must be greater than 0"
      })
      return
    }

    try {
      await addOneTimeInvestment(pensionId, {
        amount: data.amount,
        investment_date: data.investment_date,
        note: data.note && data.note.trim() !== "" ? data.note : undefined
      })
      toast.success("Success", {
        description: "One-time investment added successfully"
      })
      handleClose()
    } catch (error) {
      console.error('Failed to add one-time investment:', error)
      toast.error("Error", {
        description: "Failed to add one-time investment"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add One-Time Investment to {pensionName}</DialogTitle>
          <DialogDescription>
            This will add an one-time investment to the pension.
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
                    <NumberInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0.00"
                      min={0.01}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="investment_date"
              render={({ field: { value, onChange, onBlur, ...rest } }) => (
                <FormItem>
                  <FormLabel>Investment Date</FormLabel>
                  <FormControl>
                    <DateInput 
                      field={{ 
                        value: value ? new Date(value) : new Date(), 
                        onChange: (date) => onChange(date ? toISODateString(date) : ''),
                        onBlur,
                        ...rest
                      }} 
                    />
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
                      placeholder="Add a note about this investment..."
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
                Add Investment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 