"use client"

import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Trash2, ChevronDownIcon, PlusCircle, MessageSquare } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { Input } from "@/frontend/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator, getCurrencySymbol, formatDate } from "@/frontend/lib/transforms"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { OneTimeInvestmentModal } from "@/frontend/components/pension/etf/components/OneTimeInvestmentModal"
import { usePension } from "@/frontend/context/pension"
import { Textarea } from "@/frontend/components/ui/textarea"
import { cn } from "@/lib/utils"
import { EnumSelect } from "@/frontend/components/ui/enum-select"

interface EditETFPensionContributionStepsFormProps {
  form: UseFormReturn<ETFPensionFormData>
}

export function EditETFPensionContributionStepsForm({ form }: EditETFPensionContributionStepsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan_steps"
  })
  const { settings } = useSettings()
  const { selectedPension } = usePension()
  const [open, setOpen] = useState<number | null>(null)
  const [showOneTimeInvestment, setShowOneTimeInvestment] = useState(false)
  const [contributionInputs, setContributionInputs] = useState<string[]>([])
  const decimalSeparator = getDecimalSeparator(settings.number_locale)
  const currencySymbol = getCurrencySymbol(settings.number_locale, settings.currency)

  // Initialize contribution inputs when fields change
  useEffect(() => {
    const newInputs = fields.map((field, index) => {
      const amount = form.getValues(`contribution_plan_steps.${index}.amount`)
      return amount ? amount.toString().replace('.', decimalSeparator) : ""
    })
    setContributionInputs(newInputs)
  }, [fields, form, decimalSeparator])

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
      end_date: undefined,
      note: undefined
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Contribution Management</CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowOneTimeInvestment(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            One-Time Investment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fields.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_auto_auto] gap-4 px-4">
                <div className="text-sm font-medium text-muted-foreground">Amount</div>
                <div className="text-sm font-medium text-muted-foreground">Frequency</div>
                <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                <div className="text-sm font-medium text-muted-foreground">End Date</div>
                <div className="w-5"></div>
                <div className="w-5"></div>
              </div>

              {fields.map((field, index) => (
                <div key={field.id}>
                  <div 
                    className="grid grid-cols-[1fr_1.4fr_1fr_1fr_auto_auto] gap-2 items-center p-2 rounded-lg bg-muted"
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
                                  const value = parseNumber(contributionInputs[index] || "0", settings.number_locale)
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
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencySymbol}</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <EnumSelect<ContributionFrequency, ETFPensionFormData>
                      name={`contribution_plan_steps.${index}.frequency`}
                      control={form.control}
                      label=""
                      options={[
                        { value: ContributionFrequency.MONTHLY, label: "Monthly" },
                        { value: ContributionFrequency.QUARTERLY, label: "Quarterly" },
                        { value: ContributionFrequency.SEMI_ANNUALLY, label: "Semi-Annually" },
                        { value: ContributionFrequency.ANNUALLY, label: "Annually" },
                        { value: ContributionFrequency.ONE_TIME, label: "One-Time" }
                      ]}
                      defaultValue={ContributionFrequency.MONTHLY}
                    />

                    <FormField
                      control={form.control}
                      name={`contribution_plan_steps.${index}.start_date`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input
                              type="date"
                              value={formatDate(field.value).value}
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
                                    value={field.value ? formatDate(field.value).value : ''}
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
                                          value={field.value ? formatDate(field.value).value : ''}
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

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          title={form.getValues(`contribution_plan_steps.${index}.note`) ? "Edit note" : "Add note"}
                        >
                          <MessageSquare className={cn(
                            "h-4 w-4",
                            form.getValues(`contribution_plan_steps.${index}.note`) && "text-primary"
                          )} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <FormField
                          control={form.control}
                          name={`contribution_plan_steps.${index}.note` as const}
                          render={({ field }) => {
                            console.log(`Note field ${index} value:`, field.value)
                            return (
                              <FormItem>
                                <FormLabel>Note for this contribution</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Add a note for this contribution step..."
                                    className="h-20"
                                    onChange={(e) => {
                                      console.log(`Note ${index} changed to:`, e.target.value)
                                      field.onChange(e)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">No contribution steps defined yet.</p>
              <p className="text-sm text-muted-foreground">Add a contribution step or one-time investment to get started.</p>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed text-center h-14 text-sm text-muted-foreground hover:border-muted-foreground/50 border-2 rounded-lg"
            onClick={handleAddContribution}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {fields.length === 0 ? (
              <span>No contributions planned yet. Click to add your first contribution.</span>
            ) : (
              <span>Add Contribution</span>
            )}
          </Button>
        </div>
      </CardContent>

      <OneTimeInvestmentModal
        open={showOneTimeInvestment}
        onOpenChange={setShowOneTimeInvestment}
        pensionId={selectedPension?.id || 0}
        pensionName={selectedPension?.name || ""}
      />
    </Card>
  )
} 