"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDownIcon, PlusCircle, History, BarChart3 } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { ETFSearchCombobox } from "@/frontend/components/etf/ETFSearchCombobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Input } from "@/frontend/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/frontend/components/ui/radio-group"
import { Label } from "@/frontend/components/ui/label"

interface ETFPensionFormProps {
  form: UseFormReturn<ETFPensionFormData>
  isEditing?: boolean
}

/**
 * Form component for ETF-specific pension fields.
 * Handles ETF selection and contribution plan management.
 */
export function ETFPensionForm({ form, isEditing = false }: ETFPensionFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan_steps"
  })
  const [open, setOpen] = useState<number | null>(null)
  const [initializationMethod, setInitializationMethod] = useState<"new" | "existing" | "historical" | null>(null)

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

  const handleInitializationMethodChange = (value: "new" | "existing" | "historical") => {
    setInitializationMethod(value)
    form.setValue('initialization_method', value)
    form.setValue('is_existing_investment', value === 'existing')
    form.setValue('realize_historical_contributions', value === 'historical')
  }

  useEffect(() => {
    if (initializationMethod) {
      form.setValue('initialization_method', initializationMethod)
      form.setValue('is_existing_investment', initializationMethod === 'existing')
      form.setValue('realize_historical_contributions', initializationMethod === 'historical')
    }
  }, [initializationMethod, form])

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-6 rounded-lg border bg-card">
        <h3 className="text-lg font-medium">How would you like to initialize this ETF plan?</h3>
        <RadioGroup
          onValueChange={(value) => handleInitializationMethodChange(value as "new" | "existing" | "historical")}
          className="space-y-0"
          value={initializationMethod || ""}
        >
          <Label
            htmlFor="new"
            className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer block group"
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="new" id="new" />
                <PlusCircle className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <Label htmlFor="new" className="font-medium">
                  New Investment
                </Label>
              </div>
              <p className="text-sm text-muted-foreground pl-9">
                Start a new ETF investment from scratch. You&apos;ll be able to set up your initial 
                investment and contribution plan.
              </p>
            </div>
          </Label>

          <Label
            htmlFor="existing"
            className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer block group"
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="existing" id="existing" />
                <BarChart3 className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <Label htmlFor="existing" className="font-medium">
                  Existing Investment
                </Label>
              </div>
              <p className="text-sm text-muted-foreground pl-9">
                Track an existing ETF investment. You&apos;ll be able to enter your current holdings 
                and set up future contributions.
              </p>
            </div>
          </Label>

          <Label
            htmlFor="historical"
            className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer block group"
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="historical" id="historical" />
                <History className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <Label htmlFor="historical" className="font-medium">
                  Historical Contributions
                </Label>
              </div>
              <p className="text-sm text-muted-foreground pl-9">
                Import historical contribution data. This will help track your investment&apos;s 
                performance over time.
              </p>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {initializationMethod && (
        <>
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
                      <Input {...field} placeholder="My ETF Investment" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="etf_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ETF</FormLabel>
                    <FormControl>
                      <ETFSearchCombobox
                        value={field.value}
                        onSelect={(etf) => field.onChange(etf.id)}
                        readOnly={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {initializationMethod === 'existing' && (
                <>
                  <FormField
                    control={form.control}
                    name="existing_units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Units</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.000001"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                            placeholder="0.000000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Date</FormLabel>
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
                </>
              )}
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
                                type="number" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                placeholder="0.00"
                                className="pl-7"
                              />
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
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
        </>
      )}
    </div>
  )
} 