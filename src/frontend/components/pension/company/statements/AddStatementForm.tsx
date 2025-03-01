"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/frontend/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form"
import { Input } from "@/frontend/components/ui/input"
import { Textarea } from "@/frontend/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator, getCurrencySymbol } from "@/frontend/lib/transforms"

// Define the form schema with zod
const formSchema = z.object({
  statement_date: z.date(),
  value: z.number().min(0, "Value must be a positive number"),
  note: z.string().optional(),
  retirement_projections: z.array(
    z.object({
      retirement_age: z.number().min(50, "Retirement age must be at least 50").max(100, "Retirement age must be at most 100"),
      monthly_payout: z.number().min(0, "Monthly payout must be a positive number"),
      total_capital: z.number().min(0, "Total capital must be a positive number")
    })
  ).optional()
})

type FormValues = z.infer<typeof formSchema>

interface AddStatementFormProps {
  onSubmit: (data: FormValues) => void
  onCancel: () => void
  initialData?: Partial<FormValues>
}

export function AddStatementForm({ onSubmit, onCancel, initialData }: AddStatementFormProps) {
  const { settings } = useSettings()
  const decimalSeparator = getDecimalSeparator(settings.number_locale)
  const currencySymbol = getCurrencySymbol(settings.number_locale, settings.currency)
  
  const [valueInput, setValueInput] = useState("")
  const [projectionInputs, setProjectionInputs] = useState<{[key: string]: string}>({})
  
  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      statement_date: initialData?.statement_date || new Date(),
      value: initialData?.value || 0,
      note: initialData?.note || "",
      retirement_projections: initialData?.retirement_projections || []
    }
  })
  
  // Set up field array for retirement projections
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "retirement_projections"
  })
  
  // Validate if the input is a valid number format
  const isValidNumberFormat = (value: string): boolean => {
    // Allow empty input
    if (!value) return true
    
    // Allow only digits, one decimal separator, and one minus sign at the start
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
  }
  
  const handleAddProjection = () => {
    const newIndex = fields.length
    append({
      retirement_age: 67,
      monthly_payout: 0,
      total_capital: 0
    })
    
    // Initialize the input fields for the new projection
    setProjectionInputs({
      ...projectionInputs,
      [`${newIndex}.monthly_payout`]: "",
      [`${newIndex}.total_capital`]: ""
    })
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="statement_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statement Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value)
                        date.setUTCHours(0, 0, 0, 0)
                        field.onChange(date)
                      } else {
                        field.onChange(undefined)
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
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value ({currencySymbol})</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={valueInput || field.value.toString().replace('.', decimalSeparator)}
                      onChange={(e) => {
                        const newValue = e.target.value
                        if (isValidNumberFormat(newValue)) {
                          setValueInput(newValue)
                          const parsedValue = parseNumber(newValue, settings.number_locale)
                          if (parsedValue >= 0) {
                            field.onChange(parsedValue)
                          }
                        }
                      }}
                      onBlur={() => {
                        const value = parseNumber(valueInput, settings.number_locale)
                        if (value >= 0) {
                          setValueInput(value.toString().replace('.', decimalSeparator))
                          field.onChange(value)
                        } else {
                          setValueInput("")
                          field.onChange(0)
                        }
                        field.onBlur()
                      }}
                      placeholder={`0${decimalSeparator}00`}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional information about this statement"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional notes about this statement
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Retirement Projections</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProjection}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Projection
            </Button>
          </div>
          
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No retirement projections added yet</p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end p-4 border rounded-md">
                  <FormField
                    control={form.control}
                    name={`retirement_projections.${index}.retirement_age`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retirement Age</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="50" 
                            max="100" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 67)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`retirement_projections.${index}.monthly_payout`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Payout ({currencySymbol})</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={projectionInputs[`${index}.monthly_payout`] || field.value.toString().replace('.', decimalSeparator)}
                              onChange={(e) => {
                                const newValue = e.target.value
                                if (isValidNumberFormat(newValue)) {
                                  setProjectionInputs({
                                    ...projectionInputs,
                                    [`${index}.monthly_payout`]: newValue
                                  })
                                  const parsedValue = parseNumber(newValue, settings.number_locale)
                                  if (parsedValue >= 0) {
                                    field.onChange(parsedValue)
                                  }
                                }
                              }}
                              onBlur={() => {
                                const value = parseNumber(projectionInputs[`${index}.monthly_payout`] || "", settings.number_locale)
                                if (value >= 0) {
                                  setProjectionInputs({
                                    ...projectionInputs,
                                    [`${index}.monthly_payout`]: value.toString().replace('.', decimalSeparator)
                                  })
                                  field.onChange(value)
                                } else {
                                  setProjectionInputs({
                                    ...projectionInputs,
                                    [`${index}.monthly_payout`]: ""
                                  })
                                  field.onChange(0)
                                }
                                field.onBlur()
                              }}
                              placeholder={`0${decimalSeparator}00`}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`retirement_projections.${index}.total_capital`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Capital ({currencySymbol})</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={projectionInputs[`${index}.total_capital`] || field.value.toString().replace('.', decimalSeparator)}
                              onChange={(e) => {
                                const newValue = e.target.value
                                if (isValidNumberFormat(newValue)) {
                                  setProjectionInputs({
                                    ...projectionInputs,
                                    [`${index}.total_capital`]: newValue
                                  })
                                  const parsedValue = parseNumber(newValue, settings.number_locale)
                                  if (parsedValue >= 0) {
                                    field.onChange(parsedValue)
                                  }
                                }
                              }}
                              onBlur={() => {
                                const value = parseNumber(projectionInputs[`${index}.total_capital`] || "", settings.number_locale)
                                if (value >= 0) {
                                  setProjectionInputs({
                                    ...projectionInputs,
                                    [`${index}.total_capital`]: value.toString().replace('.', decimalSeparator)
                                  })
                                  field.onChange(value)
                                } else {
                                  setProjectionInputs({
                                    ...projectionInputs,
                                    [`${index}.total_capital`]: ""
                                  })
                                  field.onChange(0)
                                }
                                field.onBlur()
                              }}
                              placeholder={`0${decimalSeparator}00`}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="self-end"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Statement
          </Button>
        </div>
      </form>
    </Form>
  )
} 