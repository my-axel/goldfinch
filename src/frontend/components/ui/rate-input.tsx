import { Button } from "@/frontend/components/ui/button"
import { Input } from "@/frontend/components/ui/input"
import { Label } from "@/frontend/components/ui/label"
import { Minus, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export interface RateInputProps {
  label: string
  value: number | string
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  error?: string
}

export function RateInput({
  label,
  value,
  onChange,
  min = 0,
  max = 15,
  step = 0.1,
  disabled = false,
  error
}: RateInputProps) {
  const [localValue, setLocalValue] = useState("")

  useEffect(() => {
    const numericValue = Number(value)
    setLocalValue(isNaN(numericValue) ? "0.0" : numericValue.toFixed(1))
  }, [value])

  const handleIncrement = () => {
    const currentValue = Number(value)
    if (!isNaN(currentValue)) {
      const newValue = Math.min(currentValue + step, max)
      onChange(newValue)
    }
  }

  const handleDecrement = () => {
    const currentValue = Number(value)
    if (!isNaN(currentValue)) {
      const newValue = Math.max(currentValue - step, min)
      onChange(newValue)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setLocalValue(inputValue)

    const numericValue = parseFloat(inputValue)
    if (!isNaN(numericValue)) {
      const clampedValue = Math.min(Math.max(numericValue, min), max)
      const currentValue = Number(value)
      if (!isNaN(currentValue) && clampedValue !== currentValue) {
        onChange(clampedValue)
      }
    }
  }

  const handleBlur = () => {
    const numericValue = parseFloat(localValue)
    const currentValue = Number(value)
    
    if (isNaN(numericValue)) {
      setLocalValue(isNaN(currentValue) ? "0.0" : currentValue.toFixed(1))
    } else {
      const clampedValue = Math.min(Math.max(numericValue, min), max)
      setLocalValue(clampedValue.toFixed(1))
      if (!isNaN(currentValue) && clampedValue !== currentValue) {
        onChange(clampedValue)
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecrement}
          disabled={disabled || Number(value) <= min}
          type="button"
          className="h-8 w-8"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <div className="relative">
          <Input
            type="text"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            style={{ width: '60px' }}
            className={cn(
              "h-8 text-sm pr-5",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            %
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrement}
          disabled={disabled || Number(value) >= max}
          type="button"
          className="h-8 w-8"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
} 