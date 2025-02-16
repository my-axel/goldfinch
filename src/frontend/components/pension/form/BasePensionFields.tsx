"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { Input } from "@/frontend/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { UseFormReturn } from "react-hook-form"
import { formatMemberName } from "@/frontend/types/household-helpers"
import { FormData } from "@/frontend/types/pension-form"
import { useHousehold } from "@/frontend/context/HouseholdContext"

interface BasePensionFieldsProps {
  form: UseFormReturn<FormData>
  disableMemberSelection?: boolean
}

/**
 * Base form fields component that are common to all pension types.
 * These fields are immutable after pension creation.
 * 
 * Fields:
 * - Name
 * - Member selection (can be disabled if member is pre-selected)
 * - Initial capital
 * - Start date
 */
export function BasePensionFields({ form, disableMemberSelection }: BasePensionFieldsProps) {
  const { members, isLoading, error } = useHousehold()

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
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="member_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Member</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={disableMemberSelection}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading..." : "Select member"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {error ? (
                  <SelectItem value="error" disabled>
                    Error loading members
                  </SelectItem>
                ) : (
                  members.map(member => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {formatMemberName(member)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 