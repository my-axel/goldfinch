"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { Input } from "@/frontend/components/ui/input"
import { DateInput } from '@/frontend/components/ui/date-input'
import { SavingsPensionFormData } from "@/frontend/types/pension-form"
import { Textarea } from "@/frontend/components/ui/textarea"
import { EnumSelect } from "@/frontend/components/ui/enum-select"
import { CompoundingFrequency } from "@/frontend/types/pension"

interface BasicInformationCardProps {
  form: UseFormReturn<SavingsPensionFormData>
}

/**
 * Component for editing basic savings pension information.
 * Handles name, start date, compounding frequency and notes.
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
                <Input {...field} placeholder="e.g., Retirement Savings Account" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Start Date and Compounding Frequency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <DateInput
              field={field}
              label="Start Date"
            />
          )}
        />

        <EnumSelect<CompoundingFrequency, SavingsPensionFormData>
          name="compounding_frequency"
          control={form.control}
          label="Compounding Frequency"
          options={[
            { value: CompoundingFrequency.DAILY, label: "Daily" },
            { value: CompoundingFrequency.MONTHLY, label: "Monthly" },
            { value: CompoundingFrequency.QUARTERLY, label: "Quarterly" },
            { value: CompoundingFrequency.SEMI_ANNUALLY, label: "Semi-Annually" },
            { value: CompoundingFrequency.ANNUALLY, label: "Annually" }
          ]}
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
                  placeholder="Add any notes about this savings pension"
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