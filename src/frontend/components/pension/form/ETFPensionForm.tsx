"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { FormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDownIcon } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { ETFSearchCombobox } from "@/frontend/components/etf/ETFSearchCombobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Input } from "@/frontend/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { useState } from "react"
import { useHousehold } from "@/frontend/context/HouseholdContext"
import { RadioGroup, RadioGroupItem } from "@/frontend/components/ui/radio-group"

interface ETFPensionFormProps {
  form: UseFormReturn<FormData>
  isEditing?: boolean
}

/**
 * Form component for ETF-specific pension fields.
 * Handles ETF selection and contribution plan management.
 */
export function ETFPensionForm({ form, isEditing = false }: ETFPensionFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan"
  })
  const [open, setOpen] = useState<number | null>(null)
  const { members } = useHousehold()

  // Watch initialization method to conditionally show fields
  const isExistingInvestment = form.watch("is_existing_investment")

  const handleInitializationMethodChange = (value: string) => {
    if (value === "existing") {
      form.setValue("is_existing_investment", true)
      form.setValue("realize_historical_contributions", false)
    } else if (value === "historical") {
      form.setValue("is_existing_investment", false)
      form.setValue("realize_historical_contributions", true)
      // Reset existing investment fields
      form.setValue("existing_units", 0)
      form.setValue("reference_date", new Date())
    } else {
      form.setValue("is_existing_investment", false)
      form.setValue("realize_historical_contributions", false)
      // Reset existing investment fields
      form.setValue("existing_units", 0)
      form.setValue("reference_date", new Date())
    }
  }

  const handleAddContribution = () => {
    const startDate = new Date()

    append({
      amount: 0,
      frequency: ContributionFrequency.MONTHLY,
      start_date: startDate,
      end_date: undefined
    })
  }

  const handleDurationSelect = (index: number, years?: number) => {
    const startDate = form.getValues(`contribution_plan.${index}.start_date`)
    const memberId = form.getValues('member_id')
    
    if (!startDate) return
    
    if (years === undefined) {
      const member = members.find(m => m.id === parseInt(memberId))
      if (!member?.birthday) {
        form.setValue(`contribution_plan.${index}.end_date`, undefined)
        setOpen(null)
        return
      }
      const retirementDate = new Date(member.birthday)
      retirementDate.setFullYear(retirementDate.getFullYear() + (member.retirement_age_planned || 67))
      form.setValue(`contribution_plan.${index}.end_date`, retirementDate)
      setOpen(null)
      return
    }

    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)
    form.setValue(`contribution_plan.${index}.end_date`, endDate)
    setOpen(null)
  }

  return (
    <div className="space-y-6">
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

      {!isEditing && (
        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <FormLabel className="mb-4 block">Initialization Method</FormLabel>
            <FormField
              control={form.control}
              name="initialization_method"
              defaultValue="none"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={value => {
                        field.onChange(value)
                        handleInitializationMethodChange(value)
                      }}
                      className="space-y-4"
                      defaultValue="none"
                    >
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="none" />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Start fresh</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Start with no existing investment
                          </p>
                        </div>
                      </FormItem>
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="existing" />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Existing investment</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enter the number of units you already own
                          </p>
                        </div>
                      </FormItem>
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="historical" />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Realize historical contributions</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Automatically realize all contributions in the past based on historical prices
                          </p>
                        </div>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {isExistingInvestment && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="existing_units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Units Owned</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="0.000000"
                        value={field.value || 0}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
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
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          // Create a new date at midnight UTC to ensure clean date
                          const date = new Date(e.target.value);
                          date.setUTCHours(0, 0, 0, 0);
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Contribution Plan</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddContribution}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contribution
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-end">
            <FormField
              control={form.control}
              name={`contribution_plan.${index}.amount`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (€)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`contribution_plan.${index}.frequency`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ContributionFrequency.MONTHLY}>Monthly</SelectItem>
                      <SelectItem value={ContributionFrequency.QUARTERLY}>Quarterly</SelectItem>
                      <SelectItem value={ContributionFrequency.ANNUALLY}>Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`contribution_plan.${index}.start_date`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`contribution_plan.${index}.end_date`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Popover open={open === index} onOpenChange={(isOpen) => setOpen(isOpen ? index : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {field.value ? (
                          `until ${new Date(field.value).toLocaleDateString()}`
                        ) : (
                          "until planned retirement"
                        )}
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command className="w-full">
                        <CommandList>
                          <CommandGroup>
                            <CommandItem
                              className="px-2 py-1.5 cursor-pointer"
                              onSelect={() => handleDurationSelect(index, undefined)}
                            >
                              until planned retirement
                            </CommandItem>
                            {[5, 10, 15, 20, 25, 30].map(years => (
                              <CommandItem
                                key={years}
                                className="px-2 py-1.5 cursor-pointer"
                                onSelect={() => handleDurationSelect(index, years)}
                              >
                                {years} years
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <div className="p-1 border-t">
                          <Input
                            type="date"
                            className="h-8"
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
    </div>
  )
} 