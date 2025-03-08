"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { Input } from "@/frontend/components/ui/input"
import { ETFSearchCombobox } from "@/frontend/components/etf/ETFSearchCombobox"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator } from "@/frontend/lib/transforms"
import { Textarea } from "@/frontend/components/ui/textarea"

interface BasicInformationCardProps {
  form: UseFormReturn<ETFPensionFormData>
  isEditing?: boolean
  initializationMethod?: "new" | "existing" | "historical" | null
  unitsInput?: string
  setUnitsInput?: (value: string) => void
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
 * @param {string} [props.unitsInput] - The current units input value
 * @param {Function} [props.setUnitsInput] - Function to update the units input value
 */
export function BasicInformationCard({ 
  form, 
  isEditing = false,
  initializationMethod,
  unitsInput = "",
  setUnitsInput = () => {}
}: BasicInformationCardProps) {
  const { settings } = useSettings()
  const decimalSeparator = getDecimalSeparator(settings.number_locale)

  // Validate if the input is a valid number format
  const isValidNumberFormat = (value: string): boolean => {
    // Allow empty input
    if (!value) return true
    
    // Allow only digits, one decimal separator, and one minus sign at the start
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
  }

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
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={unitsInput}
                      onChange={(e) => {
                        const newValue = e.target.value
                        if (isValidNumberFormat(newValue)) {
                          setUnitsInput(newValue)
                          const parsedValue = parseNumber(newValue, settings.number_locale)
                          if (parsedValue >= 0) {
                            field.onChange(parsedValue)
                          }
                        }
                      }}
                      onBlur={() => {
                        const value = parseNumber(unitsInput, settings.number_locale)
                        if (value >= 0) {
                          setUnitsInput(value.toString().replace('.', decimalSeparator))
                          field.onChange(value)
                        } else {
                          setUnitsInput("")
                          field.onChange(0)
                        }
                        field.onBlur()
                      }}
                      placeholder={`0${decimalSeparator}000000`}
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
                    <Input
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = new Date(e.target.value)
                        date.setUTCHours(0, 0, 0, 0)
                        field.onChange(date)
                      }}
                    />
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