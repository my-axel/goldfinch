"use client"

import { LegendProps } from "recharts"

interface ChartLegendProps {
  payload?: LegendProps["payload"]
  align?: "left" | "center" | "right"
}

export function ChartLegend({ 
  payload,
  align = "right"
}: ChartLegendProps) {
  if (!payload) {
    return null
  }

  return (
    <div 
      className="flex flex-wrap gap-4 text-sm" 
      style={{ justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center" }}
    >
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
} 