"use client"

import { memo, useEffect, useState } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency, formatPercent } from "@/frontend/lib/transforms"
import {
  ExplanationStats,
  ExplanationStat,
} from "@/frontend/components/ui/explanation"
import { CalendarClock, CircleDot, TrendingUp, Wallet } from "lucide-react"
import { cn } from "@/frontend/lib/utils"
import { useEtfPension, useEtfPensionStatistics } from "@/frontend/hooks/pension/useEtfPensions"

interface HistoricalPerformanceExplanationProps {
  pensionId: number
}

export const HistoricalPerformanceExplanation = memo(function HistoricalPerformanceExplanation({ pensionId }: HistoricalPerformanceExplanationProps) {
  const { settings } = useSettings()
  
  // Use React Query hooks
  const { data: pension } = useEtfPension(pensionId)
  const { data: statistics, isLoading } = useEtfPensionStatistics(pensionId)
  
  // State for formatted values to avoid hydration mismatches
  const [formattedStats, setFormattedStats] = useState({
    totalInvested: "0",
    currentValue: "0",
    totalReturn: "0",
    annualReturn: ""
  })
  
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
      <div>
        <ExplanationStats columns={2}>
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
          <div className="h-20 animate-pulse bg-muted rounded-lg" />
        </ExplanationStats>
      </div>
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
    <div>
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
    </div>
  )
}) 