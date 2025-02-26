"use client"

import { useMemo } from "react"
import type { ReactElement } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import type { Payload } from "recharts/types/component/DefaultTooltipContent"
import { ContributionHistoryResponse } from "@/frontend/types/pension"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency } from "@/frontend/lib/transforms"
import { ChartWrapper } from "./ChartWrapper"
import { ChartTooltip } from "./ChartTooltip"
import { chartColors, chartTheme } from "./chart-theme"
import { ChartErrorBoundary } from "./ChartErrorBoundary"
import { ChartLegend } from "./ChartLegend"

interface ChartDataPoint {
  date: string
  contributions: number
  value: number
}

interface HistoricalPerformanceChartProps {
  /** Historical contribution data */
  contributionData: ContributionHistoryResponse[]
  /** Historical value data */
  valueData: { date: Date; value: number }[]
  /** Loading state of the chart */
  isLoading?: boolean
  /** Height of the chart in pixels */
  height?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * A chart component that displays historical contributions and their actual value over time.
 * Shows two lines:
 * 1. Accumulated contributions (money invested)
 * 2. Actual value based on ETF prices
 */
export function HistoricalPerformanceChart({
  contributionData,
  valueData,
  isLoading = false,
  height = 300,
  className
}: HistoricalPerformanceChartProps): ReactElement {
  const { settings } = useSettings()

  const chartData = useMemo<ChartDataPoint[]>(() => {
    try {
      // Process historical contributions
      let accumulatedAmount = 0
      const contributionPoints = new Map<string, number>()
      
      contributionData
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach((contribution) => {
          const amount = Number(contribution.amount)
          if (!isNaN(amount)) {
            accumulatedAmount += amount
            const dateKey = new Date(contribution.date).toLocaleDateString(
              settings.number_locale,
              { month: "short", year: "numeric" }
            )
            contributionPoints.set(dateKey, accumulatedAmount)
          }
        })

      // Process historical values and combine with contributions
      return valueData
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(point => {
          const dateKey = point.date.toLocaleDateString(
            settings.number_locale,
            { month: "short", year: "numeric" }
          )
          return {
            date: dateKey,
            contributions: contributionPoints.get(dateKey) || accumulatedAmount,
            value: Number(point.value.toFixed(2))
          }
        })
    } catch (error) {
      console.error('Error processing chart data:', error)
      throw new Error('Failed to process historical data')
    }
  }, [contributionData, valueData, settings.number_locale])

  const formatYAxis = (value: number): string => {
    return formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency,
      decimals: 0
    }).formatted
  }

  // Legend items
  const legendPayload = [
    {
      value: "Contributions",
      color: chartColors.secondary
    },
    {
      value: "Portfolio Value",
      color: chartColors.primary
    }
  ]

  return (
    <ChartErrorBoundary title="Historical Performance" height={height}>
      <ChartWrapper
        title="Historical Performance"
        isLoading={isLoading}
        height={height}
        className={className}
        withCard={false}
      >
        <div className="w-full" style={{ minHeight: height }}>
          <div className="mb-4">
            <ChartLegend payload={legendPayload} />
          </div>
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 15, bottom: 60 }}
            >
              <CartesianGrid {...chartTheme.grid} />
              <XAxis
                dataKey="date"
                {...chartTheme.xAxis}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis {...chartTheme.yAxis} tickFormatter={formatYAxis} />
              <Tooltip
                content={({ active, payload }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload as Payload<number, string>[]}
                    title={payload?.[0]?.payload?.date}
                  >
                    {active && payload && payload.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: chartColors.secondary }} />
                          <span className="text-sm text-muted-foreground">
                            Total Contributions:
                          </span>
                          <span className="text-sm font-medium">
                            {formatCurrency(
                              (payload[0].payload as ChartDataPoint).contributions,
                              {
                                locale: settings.number_locale,
                                currency: settings.currency,
                                decimals: 0
                              }
                            ).formatted}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: chartColors.primary }} />
                          <span className="text-sm text-muted-foreground">
                            Portfolio Value:
                          </span>
                          <span className="text-sm font-medium">
                            {formatCurrency(
                              (payload[0].payload as ChartDataPoint).value,
                              {
                                locale: settings.number_locale,
                                currency: settings.currency,
                                decimals: 0
                              }
                            ).formatted}
                          </span>
                        </div>
                      </div>
                    )}
                  </ChartTooltip>
                )}
              />
              <Line
                type="monotone"
                dataKey="contributions"
                name="Contributions"
                stroke={chartColors.secondary}
                {...chartTheme.line}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Portfolio Value"
                stroke={chartColors.primary}
                {...chartTheme.line}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>
    </ChartErrorBoundary>
  )
}