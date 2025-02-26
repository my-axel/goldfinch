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
} from "@/frontend/types/projection"
import { format } from "date-fns"
import { calculateSingleScenarioProjection } from "@/frontend/lib/projection-utils"

interface CombinedProjectionChartProps {
  data: ProjectionDataPoint[]
  contributionData: ContributionHistoryResponse[]
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
  pessimistic: number | null
  optimistic: number | null
  contributionAmount: number
  accumulatedContribution: number
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
  timeRange,
  height = 400,
  className
}: CombinedProjectionChartProps): ReactElement {
  const { settings } = useSettings()

  const todayString = new Date().toLocaleDateString(settings.number_locale, { month: "short", year: "numeric" });
  const retirementString = new Date(timeRange.end).toLocaleDateString(settings.number_locale, { month: "short", year: "numeric" });

  const chartData = useMemo<ChartDataPoint[]>(() => {
    try {

      // Get the last day of the retirement month
      const retirementDate = new Date(timeRange.end);
      const lastDayOfRetirementMonth = new Date(retirementDate.getFullYear(), retirementDate.getMonth() + 1, 0);

      // Process historical data with accumulated values
      let accumulatedContribution = 0;
      const historicalData = data
        .filter(point => !point.isProjection)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(point => {
          // Get the raw monthly contribution for this date
          const monthlyContribution = Number(contributionData.find(
            c => format(new Date(c.date), "yyyy-MM") === format(point.date, "yyyy-MM")
          )?.amount || 0);

          // Accumulate the contributions
          accumulatedContribution += monthlyContribution;

          return {
            date: new Date(point.date).toLocaleDateString(
              settings.number_locale,
              { month: "short", year: "numeric" }
            ),
            value: Number(point.value.toFixed(2)),
            historical: Number(point.value.toFixed(2)),
            realistic: null,
            pessimistic: null,
            optimistic: null,
            contributionAmount: monthlyContribution,
            accumulatedContribution: accumulatedContribution,
            isProjection: false
          };
        })

      // Get the last historical value for projections
      const lastHistoricalValue = historicalData.length > 0 
        ? historicalData[historicalData.length - 1].value 
        : 0

      // Calculate realistic scenario with proper contributions and retirement date
      const realisticScenario = calculateSingleScenarioProjection({
        initialValue: lastHistoricalValue,
        monthlyContribution: 100, // Using fixed test value
        annualReturnRate: settings.projection_realistic_rate,
        startDate: new Date(),
        endDate: lastDayOfRetirementMonth, // Use last day of retirement month
        scenarioType: 'realistic',
        historicalContributions: contributionData.map(c => ({
          date: c.date,
          amount: c.amount
        }))
      });

      // TODO: We need to make sure, that all scenarios are calculated with the real contributions from the form!

      // Calculate realistic scenario with proper contributions and retirement date
      const pessimisticScenario = calculateSingleScenarioProjection({
        initialValue: lastHistoricalValue,
        monthlyContribution: 100, // Using fixed test value
        annualReturnRate: settings.projection_pessimistic_rate,
        startDate: new Date(),
        endDate: lastDayOfRetirementMonth, // Use last day of retirement month
        scenarioType: 'pessimistic',
        historicalContributions: contributionData.map(c => ({
          date: c.date,
          amount: c.amount
        }))
      });

      // Calculate realistic scenario with proper contributions and retirement date
      const optimisticScenario = calculateSingleScenarioProjection({
        initialValue: lastHistoricalValue,
        monthlyContribution: 100, // Using fixed test value
        annualReturnRate: settings.projection_optimistic_rate,
        startDate: new Date(),
        endDate: lastDayOfRetirementMonth, // Use last day of retirement month
        scenarioType: 'optimistic',
        historicalContributions: contributionData.map(c => ({
          date: c.date,
          amount: c.amount
        }))
      });

      const projectionData = realisticScenario.dataPoints
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(point => {
          // Find matching points from other scenarios by date
          const pessimisticPoint = pessimisticScenario.dataPoints.find(
            p => format(new Date(p.date), "yyyy-MM") === format(point.date, "yyyy-MM")
          );
          const optimisticPoint = optimisticScenario.dataPoints.find(
            p => format(new Date(p.date), "yyyy-MM") === format(point.date, "yyyy-MM")
          );

          return {
            date: new Date(point.date).toLocaleDateString(
              settings.number_locale,
              { month: "short", year: "numeric" }
            ),
            value: point.value,
            historical: null,
            realistic: point.value,
            pessimistic: pessimisticPoint?.value || null,
            optimistic: optimisticPoint?.value || null,
            contributionAmount: point.contributionAmount || 0,
            accumulatedContribution: point.accumulatedContributions || 0,
            isProjection: true
          }
        });

      // Combine and sort all data
      const combinedData = [...historicalData, ...projectionData]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return combinedData;
    } catch (error) {
      console.error('Error processing chart data:', error)
      throw new Error('Failed to process projection data')
    }
  }, [data, contributionData, settings.number_locale, settings.projection_realistic_rate, settings.projection_pessimistic_rate, settings.projection_optimistic_rate, timeRange.end])

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
      value: "Pessimistic Projection",
      color: chartColors.pessimistic
    },
    {
      value: "Realistic Projection",
      color: chartColors.realistic
    },
    {
      value: "Optimistic Projection",
      color: chartColors.optimistic
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
                type="category"
                {...chartTheme.xAxis}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis {...chartTheme.yAxis} tickFormatter={formatYAxis} />

              {/* Today marker */}
              {chartData.findIndex(point => point.date === todayString) !== -1 && (
                <ReferenceLine
                  x={chartData.findIndex(point => point.date === todayString)}
                  yAxisId={0}
                  {...chartTheme.referenceLine}
                  label={{
                    value: "Today",
                    position: "insideTopLeft",
                    fill: "var(--muted-foreground)",
                    fontSize: 10
                  }}
                />
              )}

              {/* Retirement date marker */}
              {chartData.findIndex(point => point.date === retirementString) !== -1 && (
                <ReferenceLine
                  x={chartData.findIndex(point => point.date === retirementString)}
                  yAxisId={0}
                  {...chartTheme.referenceLine}
                  label={{
                    value: "Retirement",
                    position: "insideTopRight",
                    fill: "var(--muted-foreground)",
                    fontSize: 10
                  }}
                />
              )}

              {/* Lines after reference lines */}
              <Line
                type="monotone"
                dataKey="historical"
                name="Historical Value"
                stroke={chartColors.primary}
                {...chartTheme.line}
                dot={false}
                activeDot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="pessimistic"
                name="Pessimistic Projection"
                stroke={chartColors.pessimistic}
                {...chartTheme.line}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="realistic"
                name="Realistic Projection"
                stroke={chartColors.realistic}
                {...chartTheme.line}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="optimistic"
                name="Optimistic Projection"
                stroke={chartColors.optimistic}
                {...chartTheme.line}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4 }}
              />

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
                              <div className="h-3 w-3 rounded-full" 
                                style={{
                                  backgroundColor: chartColors.primary
                                }} />
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
                              <div className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: chartColors.realistic
                                }} />
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
                          {(payload[0].payload as ChartDataPoint).pessimistic !== null && (
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: chartColors.pessimistic
                                }} />
                              <span className="text-sm text-muted-foreground">
                                Pessimistic Projection:
                              </span>
                              <span className="text-sm font-medium">
                                {formatCurrency(
                                  (payload[0].payload as ChartDataPoint).pessimistic as number,
                                  {
                                    locale: settings.number_locale,
                                    currency: settings.currency,
                                    decimals: 0
                                  }
                                ).formatted}
                              </span>
                            </div>
                          )}
                          {(payload[0].payload as ChartDataPoint).optimistic !== null && (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: chartColors.optimistic
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                Optimistic Projection:
                              </span>
                              <span className="text-sm font-medium">
                                {formatCurrency(
                                  (payload[0].payload as ChartDataPoint).optimistic as number,
                                  {
                                    locale: settings.number_locale,
                                    currency: settings.currency,
                                    decimals: 0
                                  }
                                ).formatted}
                              </span>
                            </div>
                          )}
                          {(payload[0].payload as ChartDataPoint).accumulatedContribution > 0 && (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: chartColors.secondary
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                Accumulated Contributions:
                              </span>
                              <span className="text-sm font-medium">
                                {formatCurrency(
                                  (payload[0].payload as ChartDataPoint).accumulatedContribution,
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
                                Monthly Contribution:
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>
    </ChartErrorBoundary>
  )
} 