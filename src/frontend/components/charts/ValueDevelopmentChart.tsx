"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { ValueHistoryPoint } from "@/frontend/types/pension-statistics"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency } from "@/frontend/lib/transforms"
import { ChartWrapper } from "./ChartWrapper"
import { ChartTooltip } from "./ChartTooltip"
import { chartColors, chartTheme } from "./chart-theme"

interface ValueDevelopmentChartProps {
  data: ValueHistoryPoint[]
  isLoading?: boolean
  height?: number
  className?: string
}

export function ValueDevelopmentChart({
  data,
  isLoading = false,
  height = 300,
  className
}: ValueDevelopmentChartProps) {
  const { settings } = useSettings()

  const chartData = useMemo(() => {
    return data.map(point => ({
      date: new Date(point.date).toLocaleDateString(settings.number_locale, {
        month: "short",
        year: "numeric"
      }),
      value: parseFloat(point.value),
      rawDate: point.date // Keep raw date for sorting
    })).sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
  }, [data, settings.number_locale])

  const formatYAxis = (value: number) => {
    return formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency,
      decimals: 0
    }).formatted
  }

  return (
    <ChartWrapper
      title="Value Development"
      isLoading={isLoading}
      height={height}
      className={className}
    >
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
        <CartesianGrid {...chartTheme.grid} />
        <XAxis
          dataKey="date"
          {...chartTheme.xAxis}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          {...chartTheme.yAxis}
          tickFormatter={formatYAxis}
        />
        <Tooltip
          content={({ active, payload }) => (
            <ChartTooltip
              active={active}
              payload={payload}
              title={payload?.[0]?.payload?.date}
            >
              {active && payload && payload.length > 0 && (
                <div className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: chartColors.primary }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Value:
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(payload[0].value as number, {
                      locale: settings.number_locale,
                      currency: settings.currency,
                      decimals: 0
                    }).formatted}
                  </span>
                </div>
              )}
            </ChartTooltip>
          )}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={chartColors.primary}
          {...chartTheme.line}
        />
      </LineChart>
    </ChartWrapper>
  )
} 