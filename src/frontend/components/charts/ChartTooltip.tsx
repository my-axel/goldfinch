"use client"

import { ReactNode } from "react"
import { TooltipProps } from "recharts"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

interface ChartTooltipProps extends TooltipProps<ValueType, NameType> {
  title?: string
  children?: ReactNode
}

export function ChartTooltip({ 
  active, 
  payload, 
  title,
  children 
}: ChartTooltipProps) {
  if (!active || !payload) {
    return null
  }

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      {title && (
        <div className="mb-2 font-medium">
          {title}
        </div>
      )}
      {children ? (
        children
      ) : (
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">
                {item.name}:
              </span>
              <span className="text-sm font-medium">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 