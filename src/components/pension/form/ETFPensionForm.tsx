"use client"

import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { UseFormReturn } from "react-hook-form"
import { FormData } from "@/types/pension-form"

interface ETFPensionFormProps {
  form: UseFormReturn<FormData>
}

export function ETFPensionForm({ form }: ETFPensionFormProps) {
  return (
    <FormField
      control={form.control}
      name="automatic_rebalancing"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel>Automatic Rebalancing</FormLabel>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
} 