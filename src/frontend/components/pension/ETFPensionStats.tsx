"use client"

import { memo, useEffect } from "react"
import { Card, CardContent } from "@/frontend/components/ui/card"
import { usePension } from "@/frontend/context/PensionContext"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency, formatPercent } from "@/frontend/lib/transforms"
import { CalendarClock, TrendingUp, Wallet, CircleDot } from "lucide-react"
import { cn } from "@/frontend/lib/utils"

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
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="h-20 animate-pulse bg-muted" />
          </Card>
          <Card>
            <CardContent className="h-20 animate-pulse bg-muted" />
          </Card>
        </div>
        <Card>
          <CardContent className="h-20 animate-pulse bg-muted" />
        </Card>
      </div>
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-full">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
                <p className="text-lg font-bold truncate">{formatValue(statistics.total_invested_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                <p className="text-lg font-bold truncate">{formatValue(statistics.current_value)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-full">
                <CircleDot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Contributions</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-lg font-bold">{statistics.contribution_history.length}</p>
                    <span className="text-xs text-muted-foreground">total</span>
                  </div>
                  {statistics.contribution_history.length > 0 && (
                    <>
                      <div className="text-muted-foreground/40">•</div>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-lg font-bold">
                          {new Date(statistics.contribution_history[statistics.contribution_history.length - 1].date)
                            .toLocaleDateString(settings.number_locale, { 
                              month: 'short',
                              year: 'numeric'
                            })}
                        </p>
                        <span className="text-xs text-muted-foreground">last</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-full">
                <CalendarClock className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Return</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <div className="flex items-baseline gap-1.5">
                    <p className={cn(
                      "text-lg font-bold",
                      statistics.total_return >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatValue(statistics.total_return)}
                    </p>
                    <span className="text-xs text-muted-foreground">total</span>
                  </div>
                  {statistics.annual_return != null && (
                    <>
                      <div className="text-muted-foreground/40">•</div>
                      <div className="flex items-baseline gap-1.5">
                        <p className={cn(
                          "text-lg font-bold",
                          statistics.annual_return >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatPercentValue(statistics.annual_return)}
                        </p>
                        <span className="text-xs text-muted-foreground">annual</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}) 