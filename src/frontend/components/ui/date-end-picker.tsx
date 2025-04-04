'use client'

import * as React from 'react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { FormControl, FormItem, FormMessage } from './form'
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form'
import { cn } from '@/frontend/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useDateFormat } from '@/frontend/hooks/useDateFormat'
import { useHouseholdMember } from '@/frontend/hooks/useHouseholdMembers'
import { DatePicker } from './date-picker'

/**
 * DateEndPicker component props
 * 
 * This component provides a date picker specifically designed for selecting end dates,
 * with features like duration selection and retirement date integration.
 * 
 * @template TFieldValues - The form values type from react-hook-form
 * @template TName - The field name type from react-hook-form
 */
export interface DateEndPickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue'> {
  /**
   * The field object from react-hook-form's Controller
   */
  field: ControllerRenderProps<TFieldValues, TName>
  
  /**
   * The start date to use as reference for duration calculations
   * Required for duration buttons to work
   */
  startDate?: Date | null
  
  /**
   * Optional explicit retirement date
   * If provided, this takes precedence over any retirement date calculated from memberId
   */
  retirementDate?: Date
  
  /**
   * Optional member ID to automatically fetch retirement date
   * If provided and retirementDate is not set, the component will:
   * 1. Look up the member in the HouseholdContext
   * 2. Extract their retirement_date_planned
   * 3. Use it for the "Until Retirement" option
   */
  memberId?: string | number
  
  /**
   * Optional array of duration options to display
   * Each duration has a years value and display label
   */
  durations?: Array<{
    years: number
    label: string
  }>
  
  /**
   * Optional CSS class name
   */
  className?: string
  
  /**
   * Whether the component is disabled
   */
  disabled?: boolean
}

/**
 * DateEndPicker Component
 * 
 * A specialized date picker for selecting end dates with features like:
 * - Duration selection buttons (e.g., +1 Year, +5 Years)
 * - "Until Retirement" option based on member's retirement date
 * - Manual date input
 * 
 * The component can get the retirement date in two ways:
 * 1. Directly via the retirementDate prop (takes precedence)
 * 2. By looking up the member's retirement date using the memberId prop
 * 
 * @example
 * // Basic usage with react-hook-form
 * <FormField
 *   control={form.control}
 *   name="end_date"
 *   render={({ field }) => (
 *     <DateEndPicker
 *       field={field}
 *       startDate={form.watch('start_date')}
 *     />
 *   )}
 * />
 * 
 * @example
 * // With explicit retirement date
 * <DateEndPicker
 *   field={field}
 *   startDate={startDate}
 *   retirementDate={new Date('2050-01-01')}
 * />
 * 
 * @example
 * // With member ID for automatic retirement date lookup
 * <DateEndPicker
 *   field={field}
 *   startDate={startDate}
 *   memberId={form.watch('member_id')}
 * />
 */
export function DateEndPicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  field,
  startDate,
  retirementDate: propRetirementDate,
  memberId,
  durations = [
    { years: 1, label: '+1 Year' },
    { years: 2, label: '+2 Years' },
    { years: 5, label: '+5 Years' },
    { years: 10, label: '+10 Years' }
  ],
  className,
  disabled,
}: DateEndPickerProps<TFieldValues, TName>) {
  const [open, setOpen] = React.useState(false)
  const { formatDate, toDateObject } = useDateFormat()
  
  // Use React Query to fetch member data when needed
  const { data: member } = useHouseholdMember(
    memberId ? parseInt(String(memberId), 10) : 0,
    {
      enabled: !!memberId && !propRetirementDate,
    }
  )
  
  // Memoize retirement date calculation
  const retirementDate = React.useMemo(() => 
    propRetirementDate || (member?.retirement_date_planned ? new Date(member.retirement_date_planned) : undefined),
    [propRetirementDate, member?.retirement_date_planned]
  )

  // Convert retirement date to Date object for display - also memoize this
  const retirementDateObj = React.useMemo(() => 
    toDateObject(retirementDate),
    [retirementDate, toDateObject]
  )

  /**
   * Check if a duration is currently active
   */
  const isActiveDuration = React.useCallback((years: number) => {
    if (!startDate || !field.value) return false
    
    const endDate = toDateObject(field.value)
    if (!endDate) return false
    
    const calculatedEnd = new Date(startDate)
    calculatedEnd.setFullYear(calculatedEnd.getFullYear() + years)
    
    return endDate.getTime() === calculatedEnd.getTime()
  }, [field.value, startDate, toDateObject])

  /**
   * Handle duration button click
   * Calculates a new end date by adding years to the start date
   */
  const handleDuration = React.useCallback((years: number) => {
    if (!startDate) return

    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)
    field.onChange(endDate)
    setOpen(false)
  }, [field, startDate])

  /**
   * Handle "Until Retirement" button click
   * Sets the end date to the retirement date
   */
  const handleUntilRetirement = React.useCallback(() => {
    if (!startDate || !retirementDateObj) return
    field.onChange(retirementDateObj)
    setOpen(false)
  }, [field, startDate, retirementDateObj])

  /**
   * Handle custom date selection from the DatePicker
   */
  const handleDatePickerChange = React.useCallback((date: Date | undefined) => {
    field.onChange(date || null)
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
        <PopoverContent className="w-[300px] p-3 space-y-3" align="start">
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

          <DatePicker
            date={toDateObject(field.value)}
            onDateChange={handleDatePickerChange}
            placeholder="Select a date"
            disabled={disabled}
            className="w-full"
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )
} 