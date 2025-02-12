"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { mockHouseholdMembers } from "@/data/mockData"
import { formatMemberName, calculatePlannedRetirementDate } from "@/types/household-helpers"
import { FormData } from "@/types/pension-form"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, ChevronDownIcon } from "lucide-react"
import { ContributionFrequency } from "@/types/pension"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState } from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"

interface BasePensionFieldsProps {
  form: UseFormReturn<FormData>
}

/**
 * Base form fields that are common to all pension types.
 * Includes name, member selection, start date, and initial capital.
 * 
 * TODO: Replace mockHouseholdMembers with API data
 * TODO: Add validation for initial capital (min/max values)
 * TODO: Add validation for start date (not in future)
 * TODO: Add tooltips/descriptions for fields
 */
export function BasePensionFields({ form }: BasePensionFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan"
  })

  const [open, setOpen] = useState<number | null>(null)

  const getLatestEndDate = () => {
    const existingDates = fields
      .map(field => form.getValues(`contribution_plan`)[fields.indexOf(field)]?.end_date)
      .filter(Boolean) as Date[]

    if (existingDates.length === 0) return new Date()

    return new Date(Math.max(...existingDates.map(date => date.getTime())))
  }

  const handleAddContribution = () => {
    const startDate = getLatestEndDate()
    // If we found an end date, add one day to it for the new start date
    startDate.setDate(startDate.getDate() + 1)

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
      const member = mockHouseholdMembers.find(m => m.id === memberId)
      if (!member?.birthday) {
        form.setValue(`contribution_plan.${index}.end_date`, undefined)
        setOpen(null)
        return
      }
      const retirementDate = calculatePlannedRetirementDate(
        new Date(member.birthday),
        member.retirement_age_planned
      )
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
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="member_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Member</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {mockHouseholdMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {formatMemberName(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="initial_capital"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Initial Capital (€)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

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
                      value={field.value ? field.value.toISOString().split('T')[0] : ''} 
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
                          `until ${field.value.toLocaleDateString()}`
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
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : undefined
                              form.setValue(`contribution_plan.${index}.end_date`, date)
                            }}
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
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 