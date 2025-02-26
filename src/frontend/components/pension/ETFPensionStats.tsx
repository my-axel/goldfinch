"use client"

import { memo, useEffect } from "react"
import { usePension } from "@/frontend/context/PensionContext"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency, formatPercent } from "@/frontend/lib/transforms"
import { CalendarClock, TrendingUp, Wallet, CircleDot } from "lucide-react"
import { cn } from "@/frontend/lib/utils"
import {
  Explanation,
  ExplanationHeader,
  ExplanationStats,
  ExplanationStat
} from "@/frontend/components/ui/explanation"

interface ETFPensionStatsProps {
  pensionId: number
}

export const ETFPensionStats = memo(function ETFPensionStats({ pensionId }: ETFPensionStatsProps) {
  const { pensionStatistics, isLoadingStatistics, fetchPensionStatistics, pensions, fetchPension } = usePension()
  const { settings } = useSettings()
  const statistics = pensionStatistics[pensionId]
  const isLoading = isLoadingStatistics[pensionId]
  const pension = pensions.find(p => p.id === pensionId)

  useEffect(() => {
    // First ensure we have the pension data
    if (!pension) {
      fetchPension(pensionId)
      return
    }

    // Then fetch statistics if needed
    if (!statistics && !isLoading) {
      fetchPensionStatistics(pensionId)
    }
  }, [pensionId, statistics, isLoading, fetchPensionStatistics, pension, fetchPension])

  if (!pension || isLoading) {
    return (
      <Explanation>
        <ExplanationHeader>Portfolio Statistics</ExplanationHeader>
        <ExplanationStats columns={2}>
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
        </ExplanationStats>
      </Explanation>
    )
  }

  if (!statistics) {
    return null
  }

  const formatValue = (value: number): string => {
    const formatted = formatCurrency(value, { 
      locale: settings.number_locale,
      currency: settings.currency,
      decimals: 0
    })
    return formatted.formatted
  }

  const formatPercentValue = (value: number): string => {
    const formatted = formatPercent(value / 100, { 
      locale: settings.number_locale,
      decimals: 0
    })
    return formatted.formatted
  }

  return (
    <Explanation>
      <ExplanationHeader>Historical Statistics</ExplanationHeader>
      <ExplanationStats columns={2}>
        <ExplanationStat
          icon={Wallet}
          label="Total Invested"
          value={formatValue(statistics.total_invested_amount)}
        />
        <ExplanationStat
          icon={TrendingUp}
          label="Current Value"
          value={formatValue(statistics.current_value)}
        />
        <ExplanationStat
          icon={CircleDot}
          label="Contributions"
          value={statistics.contribution_history.length}
          subValue={statistics.contribution_history.length > 0 ? new Date(
            statistics.contribution_history[statistics.contribution_history.length - 1].date
          ).toLocaleDateString(settings.number_locale, { 
            month: 'short',
            year: 'numeric'
          }) : undefined}
          subLabel={statistics.contribution_history.length > 0 ? "last contribution" : undefined}
        />
        <ExplanationStat
          icon={CalendarClock}
          label="Return"
          value={formatValue(statistics.total_return)}
          valueClassName={cn(
            statistics.total_return >= 0 ? "text-green-600" : "text-red-600"
          )}
          subValue={statistics.annual_return != null ? formatPercentValue(statistics.annual_return) : undefined}
          subLabel={statistics.annual_return != null ? "annual return" : undefined}
          subValueClassName={cn(
            statistics.annual_return != null && statistics.annual_return >= 0 ? "text-green-600" : "text-red-600"
          )}
        />
      </ExplanationStats>
    </Explanation>
  )
}) 