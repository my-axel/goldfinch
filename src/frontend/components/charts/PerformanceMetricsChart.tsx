"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency, formatPercent } from "@/frontend/lib/transforms"
import { ChartWrapper } from "./ChartWrapper"
import { ChartTooltip } from "./ChartTooltip"
import { chartColors, chartTheme } from "./chart-theme"

interface ChartDataItem {
  name: string
  value: number
  color: string
  isReturn?: boolean
  isPercentage?: boolean
}

interface PerformanceMetricsChartProps {
  totalInvestedAmount: number
  currentValue: number
  totalReturn: number
  annualReturn?: number
  isLoading?: boolean
  height?: number
  className?: string
}

export function PerformanceMetricsChart({
  totalInvestedAmount,
  currentValue,
  totalReturn,
  annualReturn,
  isLoading = false,
  height = 300,
  className
}: PerformanceMetricsChartProps) {
  const { settings } = useSettings()

  const chartData = useMemo(() => {
    const data: ChartDataItem[] = [
      {
        name: "Total Invested",
        value: totalInvestedAmount,
        color: chartColors.primary
      },
      {
        name: "Current Value",
        value: currentValue,
        color: chartColors.secondary
      },
      {
        name: "Total Return",
        value: totalReturn,
        isReturn: true,
        color: totalReturn >= 0 ? chartColors.tertiary : chartColors.quaternary
      }
    ]

    if (annualReturn !== undefined) {
      data.push({
        name: "Annual Return",
        value: annualReturn,
        isReturn: true,
        isPercentage: true,
        color: annualReturn >= 0 ? chartColors.tertiary : chartColors.quaternary
      })
    }

    return data
  }, [totalInvestedAmount, currentValue, totalReturn, annualReturn])

  const formatYAxis = (value: number) => {
    return formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency,
      decimals: 0
    }).formatted
  }

  const formatValue = (value: number, isPercentage?: boolean) => {
    if (isPercentage) {
      return formatPercent(value / 100, {
        locale: settings.number_locale,
        decimals: 0
      }).formatted
    }
    return formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency,
      decimals: 0
    }).formatted
  }

  return (
    <ChartWrapper
      title="Performance Metrics"
      isLoading={isLoading}
      height={height}
      className={className}
    >
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
        <CartesianGrid {...chartTheme.grid} />
        <XAxis
          dataKey="name"
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
              title={payload?.[0]?.payload?.name}
            >
              {active && payload?.[0] && (
                <div className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: (payload[0].payload as ChartDataItem).color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Value:
                  </span>
                  <span className={`text-sm font-medium ${
                    (payload[0].payload as ChartDataItem).isReturn ? 
                      Number(payload[0].value) >= 0 ? "text-green-600" : "text-red-600" 
                      : ""
                  }`}>
                    {formatValue(
                      Number(payload[0].value), 
                      (payload[0].payload as ChartDataItem).isPercentage
                    )}
                  </span>
                </div>
              )}
            </ChartTooltip>
          )}
        />
        <Bar
          dataKey="value"
          fill={chartColors.primary}
          {...chartTheme.bar}
        />
      </BarChart>
    </ChartWrapper>
  )
} 