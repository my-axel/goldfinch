'use client'

import * as React from 'react'
import { Button } from './button'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { FormControl, FormItem, FormMessage } from './form'
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form'
import { cn } from '@/frontend/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useDateFormat } from '@/frontend/hooks/useDateFormat'

export interface DateEndPickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue'> {
  field: ControllerRenderProps<TFieldValues, TName>
  startDate?: Date | null
  retirementDate?: Date
  durations?: Array<{
    years: number
    label: string
  }>
  className?: string
  disabled?: boolean
}

export function DateEndPicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  field,
  startDate,
  retirementDate,
  durations = [
    { years: 1, label: '+1 Year' },
    { years: 2, label: '+2 Years' },
    { years: 5, label: '+5 Years' },
    { years: 10, label: '+10 Years' }
  ],
  className,
  disabled,
  ...props
}: DateEndPickerProps<TFieldValues, TName>) {
  const [open, setOpen] = React.useState(false)
  const { formatDate, toISOString, toDateObject } = useDateFormat()

  // Calculate if a duration is currently active
  const isActiveDuration = React.useCallback((years: number) => {
    if (!startDate || !field.value) return false
    
    const endDate = toDateObject(field.value)
    if (!endDate) return false
    
    const calculatedEnd = new Date(startDate)
    calculatedEnd.setFullYear(calculatedEnd.getFullYear() + years)
    
    return endDate.getTime() === calculatedEnd.getTime()
  }, [field.value, startDate, toDateObject])

  // Handle duration selection
  const handleDuration = React.useCallback((years: number) => {
    if (!startDate) return

    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)
    field.onChange(endDate)
    setOpen(false)
  }, [field, startDate])

  // Handle until retirement selection
  const handleUntilRetirement = React.useCallback(() => {
    if (!startDate || !retirementDate) return
    const date = toDateObject(retirementDate)
    if (!date) return
    field.onChange(date)
    setOpen(false)
  }, [field, startDate, retirementDate, toDateObject])

  // Convert retirement date to Date object for display
  const retirementDateObj = toDateObject(retirementDate)

  // Handle custom date input
  const handleCustomDate = React.useCallback((dateString: string) => {
    if (!dateString) {
      field.onChange(null)
      return
    }

    try {
      const date = new Date(dateString)
      date.setUTCHours(0, 0, 0, 0)
      field.onChange(date)
    } catch {
      field.onChange(null)
    }
  }, [field])

  return (
    <FormItem className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between font-normal",
                !field.value && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              {field.value ? formatDate(field.value) : "Select end date"}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-3 space-y-3" align="start">
          {/* Debug retirement date and start date */}
          {startDate && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {durations.map(({ years, label }) => (
                  <Button
                    key={years}
                    variant="outline"
                    size="sm"
                    className={cn(
                      isActiveDuration(years) && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => handleDuration(years)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {retirementDateObj && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleUntilRetirement}
                >
                  Until Retirement ({formatDate(retirementDateObj)})
                </Button>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-popover px-2 text-muted-foreground">
                    or select date
                  </span>
                </div>
              </div>
            </>
          )}

          <Input
            type="date"
            value={field.value ? toISOString(field.value) : ''}
            onChange={(e) => handleCustomDate(e.target.value)}
            disabled={disabled}
            className="w-full"
            {...props}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )
} 