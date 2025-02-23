"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDownIcon } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Input } from "@/frontend/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { useState } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator, /*getCurrencySymbol*/ } from "@/frontend/lib/transforms"

interface EditInsurancePensionFormProps {
  form: UseFormReturn<InsurancePensionFormData>
}

/**
 * Form component for editing insurance-specific pension fields.
 * Handles provider details and contribution plan management.
 */
export function EditInsurancePensionForm({ form }: EditInsurancePensionFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan_steps"
  })
  const { settings } = useSettings()
  const [open, setOpen] = useState<number | null>(null)
  const [interestInput, setInterestInput] = useState("")
  const [expectedReturnInput, setExpectedReturnInput] = useState("")
  const [contributionInputs, setContributionInputs] = useState<string[]>([])
  const decimalSeparator = getDecimalSeparator(settings.number_locale)
  //const currencySymbol = getCurrencySymbol(settings.number_locale, settings.currency)

  const handleAddContribution = () => {
    let startDate = new Date()

    // If there are existing contributions, check the last one's end date
    if (fields.length > 0) {
      const lastEndDate = form.getValues(`contribution_plan_steps.${fields.length - 1}.end_date`)
      
      if (lastEndDate) {
        // Use the day after the last end date as the start date
        startDate = new Date(lastEndDate)
        startDate.setDate(startDate.getDate() + 1)
      }
    }

    append({
      amount: 0,
      frequency: ContributionFrequency.MONTHLY,
      start_date: startDate,
      end_date: undefined
    })
  }

  const handleDurationSelect = (index: number, years?: number) => {
    const startDate = form.getValues(`contribution_plan_steps.${index}.start_date`)
    
    if (!startDate) return
    
    if (years === undefined) {
      // Set no end date for "until retirement" option
      form.setValue(`contribution_plan_steps.${index}.end_date`, undefined)
      setOpen(null)
      return
    }

    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)
    form.setValue(`contribution_plan_steps.${index}.end_date`, endDate)
    setOpen(null)
  }

  // Validate if the input is a valid number format
  const isValidNumberFormat = (value: string): boolean => {
    // Allow empty input
    if (!value) return true
    
    // Allow only digits, one decimal separator, and one minus sign at the start
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 p-6 rounded-lg border bg-card">
        <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-[1fr_2fr] gap-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="My Insurance Plan" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Insurance Company Name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contract_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Contract/Policy Number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = new Date(e.target.value)
                      date.setUTCHours(0, 0, 0, 0)
                      field.onChange(date)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guaranteed_interest"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guaranteed Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={interestInput}
                    onChange={(e) => {
                      const newValue = e.target.value
                      // Only update if the new value is a valid number format
                      if (isValidNumberFormat(newValue)) {
                        setInterestInput(newValue)
                        // Parse and update form value if we have a complete number
                        const parsedValue = parseNumber(newValue, settings.number_locale)
                        if (parsedValue >= 0) {
                          field.onChange(parsedValue / 100) // Convert to decimal
                        }
                      }
                    }}
                    onBlur={() => {
                      const value = parseNumber(interestInput, settings.number_locale)
                      if (value >= 0) {
                        // Format the display value on blur if it's valid
                        setInterestInput(value.toString().replace('.', decimalSeparator))
                        field.onChange(value / 100) // Convert to decimal
                      } else {
                        // Clear the input if the value is invalid
                        setInterestInput("")
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
            name="expected_return"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Return Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={expectedReturnInput}
                    onChange={(e) => {
                      const newValue = e.target.value
                      if (isValidNumberFormat(newValue)) {
                        setExpectedReturnInput(newValue)
                        const parsedValue = parseNumber(newValue, settings.number_locale)
                        if (parsedValue >= 0) {
                          field.onChange(parsedValue / 100) // Convert to decimal
                        }
                      }
                    }}
                    onBlur={() => {
                      const value = parseNumber(expectedReturnInput, settings.number_locale)
                      if (value >= 0) {
                        setExpectedReturnInput(value.toString().replace('.', decimalSeparator))
                        field.onChange(value / 100) // Convert to decimal
                      } else {
                        setExpectedReturnInput("")
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
        </div>
      </div>

      <div className="space-y-6 p-6 rounded-lg border bg-card">
        <h3 className="text-lg font-medium border-b pb-2">Contribution Plan</h3>

        <div className="relative">
          {fields.length > 0 && (
            <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-2 mb-2 px-2">
              <div className="text-sm font-medium text-muted-foreground">Amount</div>
              <div className="text-sm font-medium text-muted-foreground">Frequency</div>
              <div className="text-sm font-medium text-muted-foreground">Start Date</div>
              <div className="text-sm font-medium text-muted-foreground">End Date</div>
              <div className="w-9"></div>
            </div>
          )}

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div 
                key={field.id} 
                className="grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-2 items-center p-2 rounded-lg bg-muted"
              >
                <FormField
                  control={form.control}
                  name={`contribution_plan_steps.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={contributionInputs[index] || ""}
                            onChange={(e) => {
                              const newValue = e.target.value
                              if (isValidNumberFormat(newValue)) {
                                const newInputs = [...contributionInputs]
                                newInputs[index] = newValue
                                setContributionInputs(newInputs)
                                const parsedValue = parseNumber(newValue, settings.number_locale)
                                if (parsedValue >= 0) {
                                  field.onChange(parsedValue)
                                }
                              }
                            }}
                            onBlur={() => {
                              const value = parseNumber(contributionInputs[index] || "", settings.number_locale)
                              if (value >= 0) {
                                const newInputs = [...contributionInputs]
                                newInputs[index] = value.toString().replace('.', decimalSeparator)
                                setContributionInputs(newInputs)
                                field.onChange(value)
                              } else {
                                const newInputs = [...contributionInputs]
                                newInputs[index] = ""
                                setContributionInputs(newInputs)
                                field.onChange(0)
                              }
                              field.onBlur()
                            }}
                            placeholder={`0${decimalSeparator}00`}
                            className="pl-7"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{settings.currency}</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`contribution_plan_steps.${index}.frequency`}
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ContributionFrequency.MONTHLY}>Monthly</SelectItem>
                          <SelectItem value={ContributionFrequency.QUARTERLY}>Quarterly</SelectItem>
                          <SelectItem value={ContributionFrequency.SEMI_ANNUALLY}>Semi-Annually</SelectItem>
                          <SelectItem value={ContributionFrequency.ANNUALLY}>Annually</SelectItem>
                          <SelectItem value={ContributionFrequency.ONE_TIME}>One-Time</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`contribution_plan_steps.${index}.start_date`}
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const date = new Date(e.target.value)
                            date.setUTCHours(0, 0, 0, 0)
                            field.onChange(date)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`contribution_plan_steps.${index}.end_date`}
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <div className="relative">
                        <Popover open={open === index} onOpenChange={(isOpen) => setOpen(isOpen ? index : null)}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                className="pr-8"
                                readOnly
                                placeholder="No end date"
                                onClick={() => setOpen(index)}
                              />
                            </FormControl>
                          </PopoverTrigger>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
                          </div>
                          <PopoverContent className="w-[280px] p-0">
                            <Command>
                              <CommandList>
                                <CommandGroup>
                                  <CommandItem onSelect={() => handleDurationSelect(index, 1)}>
                                    1 year
                                  </CommandItem>
                                  <CommandItem onSelect={() => handleDurationSelect(index, 2)}>
                                    2 years
                                  </CommandItem>
                                  <CommandItem onSelect={() => handleDurationSelect(index, 5)}>
                                    5 years
                                  </CommandItem>
                                  <CommandItem onSelect={() => handleDurationSelect(index, 10)}>
                                    10 years
                                  </CommandItem>
                                  <CommandItem onSelect={() => handleDurationSelect(index)}>
                                    No end date
                                  </CommandItem>
                                </CommandGroup>
                                <CommandGroup>
                                  <div className="p-2 border-t">
                                    <Input
                                      type="date"
                                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                      onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : undefined
                                        if (date) {
                                          date.setUTCHours(0, 0, 0, 0)
                                        }
                                        field.onChange(date)
                                        setOpen(null)
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full"
                                    />
                                  </div>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed text-center py-6 text-sm text-muted-foreground border-2 rounded-lg"
              onClick={handleAddContribution}
            >
              <Plus className="h-4 w-4 mr-2" />
              {fields.length === 0 ? (
                <span>No contributions planned yet. Click to add your first contribution.</span>
              ) : (
                <span>Add Contribution</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 