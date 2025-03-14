"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { Input } from "@/frontend/components/ui/input"
import { ETFSearchCombobox } from "@/frontend/components/etf/ETFSearchCombobox"
import { Textarea } from "@/frontend/components/ui/textarea"
import { NumberInput } from "@/frontend/components/shared/inputs/NumberInput"
import { DateInput } from "@/frontend/components/ui/date-input"

interface BasicInformationCardProps {
  form: UseFormReturn<ETFPensionFormData>
  isEditing?: boolean
  initializationMethod?: "new" | "existing" | "historical" | null
}

/**
 * BasicInformationCard component for ETF pension forms.
 * Handles ETF selection, name, and notes fields.
 * 
 * @component
 * @param {BasicInformationCardProps} props - Component props
 * @param {UseFormReturn<ETFPensionFormData>} props.form - Form instance from react-hook-form
 * @param {boolean} [props.isEditing=false] - Whether the form is in edit mode
 * @param {string} [props.initializationMethod] - The selected initialization method
 */
export function BasicInformationCard({ 
  form, 
  isEditing = false,
  initializationMethod
}: BasicInformationCardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[1fr_2fr] gap-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="My ETF Investment" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="etf_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ETF</FormLabel>
              <FormControl>
                <ETFSearchCombobox
                  value={field.value}
                  onSelect={(etf) => field.onChange(etf.id)}
                  readOnly={isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {initializationMethod === 'existing' && (
          <>
            <FormField
              control={form.control}
              name="existing_units"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Units</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0.000000"
                      min={0}
                      decimals={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Date</FormLabel>
                  <FormControl>
                    <DateInput field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Add any notes about this pension plan"
                className="resize-none h-24"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 