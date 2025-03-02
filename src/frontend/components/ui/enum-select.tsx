"use client"

import * as React from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/frontend/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Control, FieldPath, FieldValues } from "react-hook-form"

export interface EnumOption<T extends string> {
  value: T
  label: string
}

interface EnumSelectProps<
  T extends string,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
  control: Control<TFieldValues>
  label: string
  options: EnumOption<T>[]
  defaultValue?: T
  placeholder?: string
  disabled?: boolean
}

/**
 * A specialized Select component for enum values that handles form resets gracefully.
 * This component ensures that the select field always has a valid value, even after form resets.
 */
export function EnumSelect<
  T extends string,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  options,
  defaultValue,
  placeholder = "Select an option",
  disabled = false
}: EnumSelectProps<T, TFieldValues, TName>) {
  // Use the first option as default if no default is provided
  const fallbackValue = defaultValue || (options.length > 0 ? options[0].value : undefined)
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Get the current value, falling back to the default if empty
        const currentValue = field.value || fallbackValue
        
        // Find the label for the current value
        const currentOption = options.find(option => option.value === currentValue)
        
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              value={currentValue}
              onValueChange={(value) => {
                field.onChange(value)
              }}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder}>
                    {currentOption?.label}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
} 