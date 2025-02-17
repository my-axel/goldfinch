"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDownIcon } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Input } from "@/frontend/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { useState } from "react"
import { useHousehold } from "@/frontend/context/HouseholdContext"

interface CompanyPensionFormProps {
  form: UseFormReturn<CompanyPensionFormData>
  isEditing?: boolean
}

/**
 * Form component for company-specific pension fields.
 * Handles employer details and contribution plan management.
 */
export function CompanyPensionForm({ form, isEditing = false }: CompanyPensionFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan_steps"
  })
  const [open, setOpen] = useState<number | null>(null)
  const { members } = useHousehold()

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
    const startDate = form.getValues(`contribution_plan_steps.${index}.start_date`)
    const memberId = form.getValues('member_id')
    
    if (!startDate) return
    
    if (years === undefined) {
      const member = members.find(m => m.id === parseInt(memberId))
      if (!member?.birthday) {
        form.setValue(`contribution_plan_steps.${index}.end_date`, undefined)
        setOpen(null)
        return
      }
      const retirementDate = new Date(member.birthday)
      retirementDate.setFullYear(retirementDate.getFullYear() + 67) // Default retirement age
      form.setValue(`contribution_plan_steps.${index}.end_date`, retirementDate)
      setOpen(null)
      return
    }

    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)
    form.setValue(`contribution_plan_steps.${index}.end_date`, endDate)
    setOpen(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
          name="employer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vesting_period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vesting Period (years)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="matching_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matching Percentage (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="max_employer_contribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Employer Contribution (€)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
              name={`contribution_plan_steps.${index}.amount`}
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
              name={`contribution_plan_steps.${index}.frequency`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
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
              name={`contribution_plan_steps.${index}.end_date`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <Popover open={open === index} onOpenChange={(isOpen) => setOpen(isOpen ? index : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {field.value ? new Date(field.value).toISOString().split('T')[0] : 'Select duration'}
                        <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
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
                              Until retirement
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
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
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 