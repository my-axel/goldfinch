"use client"

import { Card } from "@/frontend/components/ui/card"
import { formatCurrency } from "@/frontend/lib/transforms"
import { ProjectionScenario, ScenarioType } from "@/frontend/types/projection"
import { DEFAULT_PROJECTION_COLORS } from "../charts/chart-theme"
import { useSettings } from "@/frontend/context/SettingsContext"
import { Skeleton } from "@/frontend/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/frontend/components/ui/alert"
import { ChartErrorBoundary } from "../charts/ChartErrorBoundary"
import { Separator } from "@/frontend/components/ui/separator"

interface ProjectionScenarioKPIsProps {
  scenarios: {
    pessimistic: ProjectionScenario
    realistic: ProjectionScenario
    optimistic: ProjectionScenario
  }
  totalContributions: number
  calculationTime?: number
}

export function ProjectionScenarioKPIs({
  scenarios,
  totalContributions,
  calculationTime
}: ProjectionScenarioKPIsProps) {
  const { settings } = useSettings()

  const formatValue = (value: number) => {
    return formatCurrency(value, { 
      locale: settings.number_locale, 
      currency: settings.currency 
    }).formatted
  }

  const getScenarioColor = (type: ScenarioType) => {
    return DEFAULT_PROJECTION_COLORS.scenarios[type]
  }

  const calculateReturns = (finalValue: number) => {
    return finalValue - totalContributions
  }

  if (calculationTime && calculationTime > 100) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Projected Wealth at Retirement</h3>
        <div className="grid gap-4">
          {['pessimistic', 'realistic', 'optimistic'].map(type => (
            <Card key={type} className="p-4">
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ChartErrorBoundary title="Projection Scenarios">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Projected Wealth at Retirement</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed breakdown of projected values and returns for each scenario
          </p>
        </div>

        <div className="grid gap-4">
          {Object.entries(scenarios).map(([type, scenario]) => {
            const finalValue = scenario.finalValue
            const returns = calculateReturns(finalValue)
            const returnPercentage = (returns / totalContributions) * 100

            return (
              <Card key={type} className="p-4 transition-shadow hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getScenarioColor(type as ScenarioType) }}
                    />
                    <h4 className="font-medium capitalize">{type} Scenario</h4>
                    <div className="text-sm text-muted-foreground ml-auto">
                      {typeof scenario.returnRate === 'number' ? `${scenario.returnRate.toFixed(1)}% return` : 'No return rate'}
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="font-medium text-base">{formatValue(finalValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Returns</span>
                      <span className="font-medium text-base">{formatValue(returns)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Return on Investment</span>
                      <span className="font-medium text-base">{returnPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Contributions</span>
            <span className="font-medium text-base">{formatValue(totalContributions)}</span>
          </div>
        </div>

        {calculationTime && calculationTime > 100 && (
          <Alert variant="default" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Calculation took longer than usual ({calculationTime.toFixed(0)}ms)
            </AlertDescription>
          </Alert>
        )}
      </div>
    </ChartErrorBoundary>
  )
} 