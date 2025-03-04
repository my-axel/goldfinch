'use client'

import * as React from 'react'
import { Input } from './input'
import { FormControl, FormItem, FormLabel, FormMessage } from './form'
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form'
import { cn } from '@/frontend/lib/utils'
import { useDateFormat } from '@/frontend/hooks/useDateFormat'

export interface DateInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue'> {
  field: ControllerRenderProps<TFieldValues, TName>
  label?: string
}

export function DateInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  field,
  label,
  className,
  disabled,
  ...props
}: DateInputProps<TFieldValues, TName>) {
  const { toISOString, parseFormDate } = useDateFormat()
  
  // Convert field value to ISO date string for input
  const dateValue = toISOString(field.value)

  return (
    <FormItem className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <Input
          type="date"
          {...props}
          disabled={disabled}
          value={dateValue}
          onChange={(e) => {
            try {
              // Parse the date and set to midnight UTC
              const value = e.target.value
              if (!value) {
                field.onChange(null)
                return
              }
              const date = parseFormDate(value)
              field.onChange(date)
            } catch {
              // If invalid date, set to null
              field.onChange(null)
            }
          }}
          onBlur={field.onBlur}
          name={field.name}
          className={cn(
            dateValue === '' && 'text-muted-foreground',
            className
          )}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )
} 