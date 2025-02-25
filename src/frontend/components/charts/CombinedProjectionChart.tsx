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
  Area,
  ReferenceLine,
  ResponsiveContainer
} from "recharts"
import type { Payload } from "recharts/types/component/DefaultTooltipContent"
import { ContributionHistoryResponse } from "@/frontend/types/pension"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency } from "@/frontend/lib/transforms"
import { ChartWrapper } from "./ChartWrapper"
import { ChartTooltip } from "./ChartTooltip"
import { chartTheme, chartColors } from "./chart-theme"
import { ChartErrorBoundary } from "./ChartErrorBoundary"
import { ChartLegend } from "./ChartLegend"
import {
  ProjectionDataPoint,
  ProjectionScenario
} from "@/frontend/types/projection"
import { format } from "date-fns"

interface CombinedProjectionChartProps {
  data: ProjectionDataPoint[]
  contributionData: ContributionHistoryResponse[]
  scenarios: ProjectionScenario[]
  timeRange: {
    start: Date
    end: Date
  }
  height?: number
  className?: string
}

interface ChartDataPoint {
  date: string
  value: number
  historical: number | null
  realistic: number | null
  contributionAmount: number
  isProjection: boolean
}

interface LegendItem {
  value: string
  color: string
  onClick?: () => void
}

export function CombinedProjectionChart({
  data,
  contributionData,
  scenarios,
  timeRange,
  height = 400,
  className
}: CombinedProjectionChartProps): ReactElement {
  const { settings } = useSettings()

  console.log('Input data:', data)
  console.log('Input scenarios:', scenarios)

  const chartData = useMemo<ChartDataPoint[]>(() => {
    try {
      // Process historical data with accumulated values
      let accumulatedAmount = 0
      const historicalData = data
        .filter(point => !point.isProjection)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(point => {
          accumulatedAmount = Number((accumulatedAmount + point.value).toFixed(2))
          return {
            date: new Date(point.date).toLocaleDateString(
              settings.number_locale,
              { month: "short", year: "numeric" }
            ),
            value: accumulatedAmount,
            historical: accumulatedAmount,
            realistic: null,
            contributionAmount: Number(contributionData.find(
              c => format(new Date(c.date), "yyyy-MM") === format(point.date, "yyyy-MM")
            )?.amount || 0),
            isProjection: false
          }
        })

      // Get the last historical value for projections
      const lastHistoricalValue = historicalData.length > 0 
        ? historicalData[historicalData.length - 1].value 
        : 0

      // Process projection data - focusing only on realistic scenario
      const realisticScenario = scenarios.find(s => s.type === 'realistic')
      console.log('Realistic Scenario:', realisticScenario)
      
      const projectionData = realisticScenario ? data
        .filter(point => point.isProjection)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(point => {
          console.log('Processing projection point:', point)
          const scenarioPoint = realisticScenario.dataPoints.find(
            p => format(p.date, "yyyy-MM") === format(point.date, "yyyy-MM")
          )
          console.log('Found scenario point:', scenarioPoint)
          
          return {
            date: new Date(point.date).toLocaleDateString(
              settings.number_locale,
              { month: "short", year: "numeric" }
            ),
            value: point.value,
            historical: null,
            realistic: scenarioPoint?.value ?? null,
            contributionAmount: Number(contributionData.find(
              c => format(new Date(c.date), "yyyy-MM") === format(point.date, "yyyy-MM")
            )?.amount || 0),
            isProjection: true
          }
        }) : []

      console.log('Projection Data:', projectionData)

      // Combine and sort all data
      const combinedData = [...historicalData, ...projectionData]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // If we have both historical and projection data, connect them
      if (historicalData.length > 0 && projectionData.length > 0) {
        const transitionPoint = combinedData.findIndex(point => point.isProjection)
        if (transitionPoint !== -1) {
          // Set historical value at transition point
          combinedData[transitionPoint].historical = lastHistoricalValue
          // Set initial projection value
          combinedData[transitionPoint].realistic = lastHistoricalValue
        }
      }

      return combinedData
    } catch (error) {
      console.error('Error processing chart data:', error)
      throw new Error('Failed to process projection data')
    }
  }, [data, contributionData, scenarios, settings.number_locale])

  console.log('CombinedProjectionChart - chartData:', chartData);

  // If no data is available, render a fallback message for debugging
  if (chartData.length === 0) {
    return (
      <ChartErrorBoundary title="Portfolio Value Projection" height={height}>
        <ChartWrapper title="Portfolio Value Projection" height={height} className={className} withCard={false}>
          <div className="p-4 text-center text-muted-foreground">No chart data available</div>
        </ChartWrapper>
      </ChartErrorBoundary>
    );
  }

  const formatYAxis = (value: number): string => {
    return formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency,
      decimals: 0
    }).formatted
  }

  // Legend items - simplified for initial implementation
  const legendPayload: LegendItem[] = [
    {
      value: "Historical Value",
      color: chartColors.primary
    },
    {
      value: "Contributions",
      color: chartColors.secondary
    },
    {
      value: "Realistic Projection",
      color: chartColors.tertiary
    }
  ]

  return (
    <ChartErrorBoundary title="Portfolio Value Projection" height={height}>
      <ChartWrapper
        title="Portfolio Value Projection"
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
                    {active &&
                      payload &&
                      payload.length > 0 && (
                        <div className="space-y-1">
                          {(payload[0].payload as ChartDataPoint).historical !== null && (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: chartColors.primary
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                Historical Value:
                              </span>
                              <span className="text-sm font-medium">
                                {formatCurrency(
                                  (payload[0].payload as ChartDataPoint).historical as number,
                                  {
                                    locale: settings.number_locale,
                                    currency: settings.currency,
                                    decimals: 0
                                  }
                                ).formatted}
                              </span>
                            </div>
                          )}
                          {(payload[0].payload as ChartDataPoint).realistic !== null && (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: chartColors.tertiary
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                Realistic Projection:
                              </span>
                              <span className="text-sm font-medium">
                                {formatCurrency(
                                  (payload[0].payload as ChartDataPoint).realistic as number,
                                  {
                                    locale: settings.number_locale,
                                    currency: settings.currency,
                                    decimals: 0
                                  }
                                ).formatted}
                              </span>
                            </div>
                          )}
                          {(payload[0].payload as ChartDataPoint).contributionAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: chartColors.secondary
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                Contribution:
                              </span>
                              <span className="text-sm font-medium">
                                {formatCurrency(
                                  (payload[0].payload as ChartDataPoint).contributionAmount,
                                  {
                                    locale: settings.number_locale,
                                    currency: settings.currency,
                                    decimals: 0
                                  }
                                ).formatted}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                  </ChartTooltip>
                )}
              />

              {/* Contribution area */}
              <Area
                type="monotone"
                dataKey="contributionAmount"
                stroke={chartColors.secondary}
                fill={chartColors.secondary}
                fillOpacity={0.1}
                strokeWidth={1}
                dot={false}
              />

              {/* Historical value line */}
              <Line
                type="monotone"
                dataKey="historical"
                name="Historical Value"
                stroke={chartColors.primary}
                {...chartTheme.line}
                dot={false}
                activeDot={{ r: 4 }}
              />

              {/* Realistic projection line */}
              <Line
                type="monotone"
                dataKey="realistic"
                name="Realistic Projection"
                stroke={chartColors.tertiary}
                {...chartTheme.line}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4 }}
              />

              {/* Today marker */}
              <ReferenceLine
                x={new Date(timeRange.start).toLocaleDateString(settings.number_locale, { month: "short", year: "numeric" })}
                label={{
                  value: "Today",
                  position: "insideTopLeft",
                  fill: chartTheme.yAxis.style.fill,
                  fontSize: 12
                }}
                {...chartTheme.referenceLine}
              />

              {/* Retirement date marker */}
              <ReferenceLine
                x={new Date(timeRange.end).toLocaleDateString(settings.number_locale, { month: "short", year: "numeric" })}
                label={{
                  value: "Retirement",
                  position: "insideTopRight",
                  fill: chartTheme.yAxis.style.fill,
                  fontSize: 12
                }}
                {...chartTheme.referenceLine}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>
    </ChartErrorBoundary>
  )
} 