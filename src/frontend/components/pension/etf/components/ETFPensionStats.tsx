"use client"

import { memo, useEffect, useState } from "react"
import { usePension } from "@/frontend/context/pension"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency, formatPercent } from "@/frontend/lib/transforms"
import {
  ExplanationStats,
  ExplanationStat,
  Explanation,
  ExplanationHeader
} from "@/frontend/components/ui/explanation"
import { CalendarClock, CircleDot, TrendingUp, Wallet } from "lucide-react"
import { cn } from "@/frontend/lib/utils"
import { PensionType } from "@/frontend/types/pension"

interface ETFPensionStatsProps {
  pensionId: number
}

export const ETFPensionStats = memo(function ETFPensionStats({ pensionId }: ETFPensionStatsProps) {
  const { pensionStatistics, isLoadingStatistics, fetchPensionStatistics, pensions, fetchPension } = usePension()
  const { settings } = useSettings()
  const statistics = pensionStatistics[pensionId]
  const isLoading = isLoadingStatistics[pensionId]
  const pension = pensions.find(p => p.id === pensionId)
  
  // State for formatted values to avoid hydration mismatches
  const [formattedStats, setFormattedStats] = useState({
    totalInvested: "0",
    currentValue: "0",
    totalReturn: "0",
    annualReturn: ""
  })

  useEffect(() => {
    // First ensure we have the pension data
    if (!pension) {
      fetchPension(pensionId, PensionType.ETF_PLAN)
      return
    }

    // Then fetch statistics if needed
    if (!statistics && !isLoading) {
      fetchPensionStatistics(pensionId, PensionType.ETF_PLAN)
    }
  }, [pensionId, statistics, isLoading, fetchPensionStatistics, pension, fetchPension])
  
  // Format values client-side only to avoid hydration mismatches
  useEffect(() => {
    if (statistics) {
      setFormattedStats({
        totalInvested: formatCurrency(statistics.total_invested_amount, { 
          locale: settings.number_locale,
          currency: settings.currency,
          decimals: 0
        }).formatted,
        currentValue: formatCurrency(statistics.current_value, { 
          locale: settings.number_locale,
          currency: settings.currency,
          decimals: 0
        }).formatted,
        totalReturn: formatCurrency(statistics.total_return, { 
          locale: settings.number_locale,
          currency: settings.currency,
          decimals: 0
        }).formatted,
        annualReturn: statistics.annual_return != null 
          ? formatPercent(statistics.annual_return / 100, { 
              locale: settings.number_locale,
              decimals: 0
            }).formatted
          : ""
      })
    }
  }, [statistics, settings])

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
  
  // Format the last contribution date
  const lastContributionDate = statistics.contribution_history.length > 0 
    ? new Date(statistics.contribution_history[statistics.contribution_history.length - 1].date)
        .toLocaleDateString(settings.number_locale, { month: 'short', year: 'numeric' })
    : undefined

  return (
    <Explanation>
      <ExplanationHeader>Historical Statistics</ExplanationHeader>
      <ExplanationStats columns={2}>
        <ExplanationStat
          icon={Wallet}
          label="Total Invested"
          value={formattedStats.totalInvested}
        />
        <ExplanationStat
          icon={TrendingUp}
          label="Current Value"
          value={formattedStats.currentValue}
        />
        <ExplanationStat
          icon={CircleDot}
          label="Contributions"
          value={statistics.contribution_history.length}
          subValue={lastContributionDate}
          subLabel={statistics.contribution_history.length > 0 ? "last contribution" : undefined}
        />
        <ExplanationStat
          icon={CalendarClock}
          label="Return"
          value={formattedStats.totalReturn}
          valueClassName={cn(
            statistics.total_return >= 0 ? "text-green-600" : "text-red-600"
          )}
          subValue={formattedStats.annualReturn || undefined}
          subLabel={statistics.annual_return != null ? "annual return" : undefined}
          subValueClassName={cn(
            statistics.annual_return != null && statistics.annual_return >= 0 ? "text-green-600" : "text-red-600"
          )}
        />
      </ExplanationStats>
    </Explanation>
  )
}) 