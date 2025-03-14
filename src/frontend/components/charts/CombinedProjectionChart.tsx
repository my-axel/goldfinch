"use client"

import { useMemo, useState } from "react"
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
import { ChartTooltip } from "./ChartTooltip"
import { chartTheme, chartColors } from "./chart-theme"
import { ChartErrorBoundary } from "./ChartErrorBoundary"
import { ChartLegend } from "./ChartLegend"
import {
  ProjectionDataPoint,
} from "@/frontend/types/projection"
import { format } from "date-fns"
import { ContributionStep } from "@/frontend/types/pension"
import { Card, CardHeader, CardTitle, CardContent } from "@/frontend/components/ui/card"
import { Button } from "@/frontend/components/ui/button"
import { Expand, Shrink } from "lucide-react"
import { useProjectionScenarios } from "@/frontend/hooks/useProjectionScenarios"

interface CombinedProjectionChartProps {
  data: ProjectionDataPoint[]
  contributionData: ContributionHistoryResponse[]
  contributionSteps: ContributionStep[]
  timeRange: {
    start: Date
    end: Date
  }
  height?: number
  className?: string
  /** Whether to render the chart as a card with header */
  asCard?: boolean
  /** Whether to show the expand button */
  expandable?: boolean
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
  contributionSteps,
  timeRange,
  height = 400,
  className,
  asCard = true,
  expandable = false
}: CombinedProjectionChartProps): ReactElement {
  const { settings } = useSettings()
  const [isExpanded, setIsExpanded] = useState(false)
  const chartHeight = expandable && isExpanded ? 600 : height

  const todayString = new Date().toLocaleDateString(settings.number_locale, { month: "short", year: "numeric" });
  const retirementString = new Date(timeRange.end).toLocaleDateString(settings.number_locale, { month: "short", year: "numeric" });

  // Use the new hook for scenario calculations
  const { scenarios } = useProjectionScenarios({
    historicalData: data,
    contributionSteps,
    retirementDate: timeRange.end,
    historicalContributions: contributionData
  })

  // Transform data for chart display
  const chartData = useMemo<ChartDataPoint[]>(() => {
    try {
      // Process historical data
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
        });

      if (!scenarios) {
        return historicalData;
      }

      // Process projection data
      const projectionData = scenarios.scenarios.realistic.dataPoints
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(point => {
          const pessimisticPoint = scenarios.scenarios.pessimistic.dataPoints.find(
            p => format(new Date(p.date), "yyyy-MM") === format(point.date, "yyyy-MM")
          );
          const optimisticPoint = scenarios.scenarios.optimistic.dataPoints.find(
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
          };
        });

      // Combine and sort all data
      return [...historicalData, ...projectionData]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error processing chart data:', error);
      throw new Error('Failed to process projection data');
    }
  }, [data, contributionData, settings.number_locale, scenarios]);

  // If no data is available, render a fallback message
  if (chartData.length === 0) {
    return (
      <ChartErrorBoundary title="Portfolio Value Projection" height={height}>
        <div className="p-4 text-center text-muted-foreground">No chart data available</div>
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

  // Legend items
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

  const chartContent = (
    <div className="w-full" style={{ minHeight: chartHeight }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 25, bottom: 10 }}
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
  )

  if (!asCard) {
    return (
      <ChartErrorBoundary title="Portfolio Value Projection" height={chartHeight}>
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-end">
            <div className="flex items-center gap-4">
              <ChartLegend payload={legendPayload} />
              {expandable && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  type="button"
                  className="h-8 w-8"
                  title={isExpanded ? "Collapse chart" : "Expand chart"}
                >
                  {isExpanded ? (
                    <Shrink className="h-4 w-4" />
                  ) : (
                    <Expand className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
          {chartContent}
        </div>
      </ChartErrorBoundary>
    )
  }

  return (
    <ChartErrorBoundary title="Portfolio Value Projection" height={chartHeight}>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Value Projection</CardTitle>
          <div className="flex items-center gap-4">
            <ChartLegend payload={legendPayload} />
            {expandable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                type="button"
                className="h-8 w-8"
                title={isExpanded ? "Collapse chart" : "Expand chart"}
              >
                {isExpanded ? (
                  <Shrink className="h-4 w-4" />
                ) : (
                  <Expand className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {chartContent}
        </CardContent>
      </Card>
    </ChartErrorBoundary>
  )
} 