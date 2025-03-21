'use client'

import * as React from 'react'
import { FormControl, FormItem, FormLabel, FormMessage } from './form'
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form'
import { cn } from '@/frontend/lib/utils'
import { useDateFormat } from '@/frontend/hooks/useDateFormat'
import { DatePicker } from './date-picker'

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
}: DateInputProps<TFieldValues, TName>) {
  const { toDateObject } = useDateFormat()
  
  // Convert field value to Date object
  const dateValue = toDateObject(field.value)

  // Handle date selection from the picker
  const handleDateChange = (date: Date | undefined) => {
    field.onChange(date || null)
    field.onBlur()
  }

  return (
    <FormItem className={className}>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <DatePicker
          date={dateValue}
          onDateChange={handleDateChange}
          placeholder="Select date"
          disabled={disabled}
          className={cn(
            !dateValue && 'text-muted-foreground',
            className
          )}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )
} 