"use client"

import { FormField, FormItem, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { Input } from "@/frontend/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator } from "@/frontend/lib/transforms"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card"
import { EnumSelect } from "@/frontend/components/ui/enum-select"

interface ContributionPlanCardProps {
  form: UseFormReturn<CompanyPensionFormData>
}

/**
 * Card component for managing contribution plan steps.
 * Handles adding, editing, and removing contribution steps with dates and amounts.
 */
export function ContributionPlanCard({ form }: ContributionPlanCardProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan_steps"
  })
  
  const { settings } = useSettings()
  const [open, setOpen] = useState<number | null>(null)
  const [contributionInputs, setContributionInputs] = useState<string[]>([])
  const decimalSeparator = getDecimalSeparator(settings.number_locale)

  // Initialize contribution inputs when fields change
  useEffect(() => {
    const newInputs = fields.map((field, index) => {
      const amount = form.getValues(`contribution_plan_steps.${index}.amount`)
      return amount ? amount.toString().replace('.', decimalSeparator) : ""
    })
    setContributionInputs(newInputs)
  }, [fields, form, decimalSeparator])

  const isValidNumberFormat = (value: string): boolean => {
    if (!value) return true
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
  }

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
    
    // Add a new entry to the contributionInputs array
    setContributionInputs([...contributionInputs, ""])
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1.5">
          <CardTitle>Contribution Plan</CardTitle>
          <CardDescription>
            Manage your contribution plan steps and durations
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {fields.length > 0 && (
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 mb-2 px-2">
              <div className="text-sm font-medium text-muted-foreground">Amount</div>
              <div className="text-sm font-medium text-muted-foreground">Frequency</div>
              <div className="text-sm font-medium text-muted-foreground">Start Date</div>
              <div className="text-sm font-medium text-muted-foreground">End Date</div>
              <div className="w-9"></div>
            </div>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-end p-3 pt-1 rounded-lg bg-muted">
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
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`contribution_plan_steps.${index}.frequency`}
                  render={() => (
                    <FormItem className="space-y-0">
                      <FormControl>
                        <EnumSelect<ContributionFrequency, CompanyPensionFormData>
                          name={`contribution_plan_steps.${index}.frequency`}
                          control={form.control}
                          options={[
                            { value: ContributionFrequency.MONTHLY, label: "Monthly" },
                            { value: ContributionFrequency.QUARTERLY, label: "Quarterly" },
                            { value: ContributionFrequency.SEMI_ANNUALLY, label: "Semi-Annually" },
                            { value: ContributionFrequency.ANNUALLY, label: "Annually" },
                            { value: ContributionFrequency.ONE_TIME, label: "One-Time" }
                          ]}
                          defaultValue={ContributionFrequency.MONTHLY}
                          label=""
                        />
                      </FormControl>
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
                      <FormControl>
                        <Popover open={open === index} onOpenChange={(isOpen) => isOpen ? setOpen(index) : setOpen(null)}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal h-9"
                              >
                                {field.value ? new Date(field.value).toLocaleDateString() : "No end date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
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
                  className="h-9 w-9 self-end"
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
      </CardContent>
    </Card>
  )
} 