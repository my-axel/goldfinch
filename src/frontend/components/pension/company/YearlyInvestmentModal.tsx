"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/frontend/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { Input } from "@/frontend/components/ui/input"
import { Button } from "@/frontend/components/ui/button"
import { useForm } from "react-hook-form"
import { usePension } from "@/frontend/context/pension"
import { useSettings } from "@/frontend/context/SettingsContext"
import { Textarea } from "@/frontend/components/ui/textarea"
import { toast } from "sonner"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { parseNumber, getDecimalSeparator, getCurrencySymbol } from "@/frontend/lib/transforms"
import { useState, useEffect } from "react"

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
  const { settings } = useSettings()
  const [amountInput, setAmountInput] = useState("")
  
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
      setAmountInput("")
    }
  }, [open, form])

  const handleClose = () => {
    form.reset()
    setAmountInput("")
    onOpenChange(false)
  }

  const handleSubmit = async (data: YearlyInvestmentFormData) => {
    // Parse the amount one final time to ensure we have a valid number
    const finalAmount = parseNumber(amountInput, settings.number_locale)
    if (finalAmount <= 0) {
      form.setError("amount", {
        type: "manual",
        message: "Amount must be greater than 0"
      })
      return
    }

    try {
      await createContributionHistory(pensionId, {
        amount: finalAmount,
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

  // Get the decimal separator for the current locale
  const decimalSeparator = getDecimalSeparator(settings.number_locale)
  const currencySymbol = getCurrencySymbol(settings.number_locale, settings.currency)

  // Validate if the input is a valid number format
  const isValidNumberFormat = (value: string): boolean => {
    // Allow empty input
    if (!value) return true
    
    // Allow only digits, one decimal separator, and one minus sign at the start
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
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
                  <FormLabel>Amount ({currencySymbol})</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={amountInput}
                      onChange={(e) => {
                        const newValue = e.target.value
                        // Only update if the new value is a valid number format
                        if (isValidNumberFormat(newValue)) {
                          setAmountInput(newValue)
                          // Parse and update form value if we have a complete number
                          const parsedValue = parseNumber(newValue, settings.number_locale)
                          if (parsedValue > 0) {
                            field.onChange(parsedValue)
                          }
                        }
                      }}
                      onBlur={() => {
                        const value = parseNumber(amountInput, settings.number_locale)
                        if (value > 0) {
                          // Format the display value on blur if it's valid
                          setAmountInput(value.toString().replace('.', decimalSeparator))
                          field.onChange(value)
                        } else {
                          // Clear the input if the value is 0 or invalid
                          setAmountInput("")
                          field.onChange(0)
                        }
                        field.onBlur()
                      }}
                      placeholder={`0${decimalSeparator}00`}
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
                    <Input 
                      type="date" 
                      {...field}
                      value={field.value}
                      onChange={(e) => {
                        try {
                          field.onChange(e.target.value)
                        } catch (error) {
                          console.error('Error parsing date:', error)
                        }
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