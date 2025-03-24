'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/frontend/lib/utils'
import { Button } from './button'
import { Calendar } from './calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'
import { useDateFormat } from '@/frontend/hooks/useDateFormat'

interface DatePickerProps {
  date?: Date | null
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({ 
  date, 
  onDateChange, 
  placeholder = "Pick a date",
  className,
  disabled
}: DatePickerProps) {
  const { formatDate } = useDateFormat()
  const [formattedDate, setFormattedDate] = React.useState<string>('')
  const [open, setOpen] = React.useState(false)
  
  // Format the date client-side to prevent hydration mismatch
  React.useEffect(() => {
    if (date) {
      setFormattedDate(formatDate(date))
    }
  }, [date, formatDate])
  
  // Handle date selection and close popover
  const handleDateSelect = React.useCallback((selectedDate: Date | undefined) => {
    if (onDateChange) {
      onDateChange(selectedDate)
    }
    setOpen(false)
  }, [onDateChange])
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formattedDate : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
} 