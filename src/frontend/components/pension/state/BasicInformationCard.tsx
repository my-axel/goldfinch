"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { Input } from "@/frontend/components/ui/input"
import { DateInput } from '@/frontend/components/ui/date-input'
import { StatePensionFormData } from "@/frontend/types/pension-form"
import { Textarea } from "@/frontend/components/ui/textarea"

interface BasicInformationCardProps {
  form: UseFormReturn<StatePensionFormData>
}

/**
 * Component for editing basic state pension information.
 * Handles name, start date, and notes.
 */
export function BasicInformationCard({ form }: BasicInformationCardProps) {
  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="e.g., State Pension" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Start Date */}
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DateInput field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ''}
                  placeholder="Add any notes about this pension plan"
                  className="resize-none h-24"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
} 