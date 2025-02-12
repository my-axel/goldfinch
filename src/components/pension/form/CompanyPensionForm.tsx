"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/types/pension-form"

interface CompanyPensionFormProps {
  form: UseFormReturn<FormData>
}

export function CompanyPensionForm({ form }: CompanyPensionFormProps) {
  return (
    <div className="grid gap-4 grid-cols-2">
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
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 