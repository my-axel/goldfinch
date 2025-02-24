"use client"

import { useMemo } from "react"
import type { ReactElement } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"
import type { Payload } from "recharts/types/component/DefaultTooltipContent"
import { ContributionHistoryResponse } from "@/frontend/types/pension"
import { ContributionStep } from "@/frontend/types/pension"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency } from "@/frontend/lib/transforms"
import { ChartWrapper } from "./ChartWrapper"
import { ChartTooltip } from "./ChartTooltip"
import { chartColors, chartTheme } from "./chart-theme"
import { generateFutureContributions } from "@/frontend/lib/contribution-plan"

interface HistoricalDataPoint {
  date: Date
  formattedDate: string
  value: number
  isPlanned: boolean
  isManual?: boolean
}

interface ChartDataPoint {
  date: string
  value: number
  isPlanned: boolean
  isManual?: boolean
  historical: number | null
  future: number | null
}

interface ContributionHistoryChartProps {
  data: ContributionHistoryResponse[]
  contributionPlan?: ContributionStep[]
  retirementDate?: Date
  isLoading?: boolean
  height?: number
  className?: string
}

export function ContributionHistoryChart({
  data,
  contributionPlan = [],
  retirementDate,
  isLoading = false,
  height = 300,
  className
}: ContributionHistoryChartProps): ReactElement {
  const { settings } = useSettings()

  const chartData = useMemo<ChartDataPoint[]>(() => {
    let accumulatedAmount = 0
    const historicalData: HistoricalDataPoint[] = data
      .slice()
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .map((contribution) => {
        const amount =
          typeof contribution.amount === "number"
            ? contribution.amount
            : parseFloat(String(contribution.amount))
        if (!isNaN(amount)) {
          accumulatedAmount = Number(
            (accumulatedAmount + amount).toFixed(2)
          )
        }
        return {
          date: new Date(contribution.date),
          formattedDate: new Date(contribution.date).toLocaleDateString(
            settings.number_locale,
            { month: "short", year: "numeric" }
          ),
          value: accumulatedAmount,
          isPlanned: false,
          isManual: contribution.is_manual
        }
      })

    const lastHistoricalDate =
      historicalData.length > 0
        ? historicalData[historicalData.length - 1].date
        : new Date()
    const lastHistoricalAmount =
      historicalData.length > 0
        ? historicalData[historicalData.length - 1].value
        : 0

    const futureContributions = generateFutureContributions(
      contributionPlan,
      retirementDate
    )
    let plannedAmount = lastHistoricalAmount
    const futureData: HistoricalDataPoint[] = futureContributions
      .filter(
        (contribution) => contribution.date > lastHistoricalDate
      )
      .map((contribution) => {
        const amount =
          typeof contribution.amount === "number"
            ? contribution.amount
            : parseFloat(String(contribution.amount))
        if (!isNaN(amount)) {
          plannedAmount = Number(
            (plannedAmount + amount).toFixed(2)
          )
        }
        return {
          date: contribution.date,
          formattedDate: contribution.date.toLocaleDateString(
            settings.number_locale,
            { month: "short", year: "numeric" }
          ),
          value: plannedAmount,
          isPlanned: true
        }
      })

    // Combine historical and future data (each point's payload contains its original date, value, etc.)
    const baseData = [...historicalData, ...futureData].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    ).map((point) => ({
      date: point.formattedDate,
      value: point.value,
      isPlanned: point.isPlanned,
      isManual: point.isManual
    }))

    // Determine where future data begins. The connecting point appears in both series.
    const connectingIndex = baseData.findIndex(
      (p) => p.isPlanned === true
    )

    return baseData.map((point, idx) => {
      let historical: number | null = null
      let future: number | null = null
      if (connectingIndex === -1) {
        // All data is historical if no point is marked planned.
        historical = point.value
      } else {
        if (idx < connectingIndex) {
          historical = point.value
        } else if (idx === connectingIndex) {
          // Duplicate the connecting point
          historical = point.value
          future = point.value
        } else {
          future = point.value
        }
      }
      return {
        ...point,
        historical,
        future
      }
    })
  }, [data, contributionPlan, settings.number_locale, retirementDate])

  const formatYAxis = (value: number): string => {
    return formatCurrency(value, {
      locale: settings.number_locale,
      currency: settings.currency,
      decimals: 0
    }).formatted
  }

  return (
    <ChartWrapper
      title="Contribution Development"
      isLoading={isLoading}
      height={height}
      className={className}
      withCard={false}
    >
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 15, bottom: 10 }}
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
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: chartColors.primary
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {(payload[0].payload as ChartDataPoint)
                          .isPlanned
                          ? "Planned"
                          : "Historical"}
                        :
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(
                          payload[0].value as number,
                          {
                            locale: settings.number_locale,
                            currency: settings.currency,
                            decimals: 0
                          }
                        ).formatted}
                      </span>
                    </div>
                    {(payload[0].payload as ChartDataPoint).isManual && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Manual Contribution
                      </div>
                    )}
                  </div>
                )}
            </ChartTooltip>
          )}
        />
        {/* The solid (historical) line */}
        <Line
          type="monotone"
          dataKey="historical"
          name="Contributions"
          stroke={chartColors.primary}
          {...chartTheme.line}
          dot={false}
          activeDot={{ r: 4 }}
          legendType="none"
        />
        {/* The future (planned) line – rendered as dashed */}
        <Line
          type="monotone"
          dataKey="future"
          name="Contributions"
          stroke={chartColors.primary}
          strokeDasharray="4 4"
          {...chartTheme.line}
          dot={false}
          activeDot={{ r: 4 }}
          legendType="none"
        />
      </LineChart>
    </ChartWrapper>
  )
}