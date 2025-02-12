"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UseFormReturn } from "react-hook-form"
import { mockHouseholdMembers } from "@/data/mockData"
import { formatMemberName } from "@/types/household-helpers"
import { FormData } from "@/types/pension-form"

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
  return (
    <div className="grid gap-4 grid-cols-2">
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
        name="member_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Household Member</FormLabel>
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
        name="initial_capital"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Initial Capital (€)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 