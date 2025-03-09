"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { PensionType } from "@/frontend/types/pension"
import { Input } from "@/frontend/components/ui/input"
import { EnumSelect, EnumOption } from "@/frontend/components/ui/enum-select"
import { DateInput } from '@/frontend/components/ui/date-input'
import { PercentInput } from '@/frontend/components/shared/inputs/PercentInput'
import { NumberInput } from '@/frontend/components/shared/inputs/NumberInput'
import { InsurancePensionFormData } from "@/frontend/types/pension-form"

interface BasicInformationCardProps {
  form: UseFormReturn<InsurancePensionFormData>
}

// Convert PensionType enum to options array
const pensionTypeOptions: EnumOption<PensionType>[] = Object.entries(PensionType).map(([key, value]) => ({
  value,
  label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}))

/**
 * Component for editing basic insurance pension information.
 * Handles name, provider, type, dates, and interest rates.
 */
export function BasicInformationCard({ form }: BasicInformationCardProps) {
  return (
    <div className="space-y-6">
      {/* Name and Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Riester-Rente" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Insurance company name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Type and Contract Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="type"
          render={() => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <EnumSelect<PensionType, InsurancePensionFormData>
                  name="type"
                  control={form.control}
                  options={pensionTypeOptions}
                  defaultValue={PensionType.INSURANCE}
                  placeholder="Select pension type"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contract_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Number (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Policy or contract number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Start Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Interest Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="guaranteed_interest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guaranteed Interest Rate (%) (Optional)</FormLabel>
              <FormControl>
                <PercentInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g., 1.5"
                  min={0}
                  max={100}
                  decimals={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expected_return"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Return Rate (%) (Optional)</FormLabel>
              <FormControl>
                <NumberInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g., 3.5"
                  min={0}
                  max={100}
                  decimals={1}
                />
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
                <Input {...field} placeholder="Additional information" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}