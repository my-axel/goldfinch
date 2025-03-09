"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { ContributionFrequency } from "@/frontend/types/pension"
import { Input } from "@/frontend/components/ui/input"
import { EnumSelect } from "@/frontend/components/ui/enum-select"
import { DateInput } from '@/frontend/components/ui/date-input'
import { CurrencyInput } from "@/frontend/components/shared/inputs/CurrencyInput"

interface BasicInformationCardProps {
  form: UseFormReturn<CompanyPensionFormData>
}

/**
 * Component for editing basic company pension information.
 * Handles name, employer, dates, and contribution details.
 */
export function BasicInformationCard({ form }: BasicInformationCardProps) {
  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="My Company Plan" />
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
                <Input {...field} placeholder="Company Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
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

        <FormField
          control={form.control}
          name="contribution_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regular Contribution</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  decimals={2}
                  min={0}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <EnumSelect<ContributionFrequency, CompanyPensionFormData>
          name="contribution_frequency"
          control={form.control}
          label="Contribution Frequency"
          options={[
            { value: ContributionFrequency.MONTHLY, label: "Monthly" },
            { value: ContributionFrequency.QUARTERLY, label: "Quarterly" },
            { value: ContributionFrequency.SEMI_ANNUALLY, label: "Semi-Annually" },
            { value: ContributionFrequency.ANNUALLY, label: "Annually" },
            { value: ContributionFrequency.ONE_TIME, label: "One-Time" }
          ]}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Additional information about this pension" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 