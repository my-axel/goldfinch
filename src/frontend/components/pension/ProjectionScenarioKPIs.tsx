"use client"

import { Card } from "@/frontend/components/ui/card"
import { formatCurrency } from "@/frontend/lib/transforms"
import { ProjectionScenario, ScenarioType } from "@/frontend/types/projection"
import { DEFAULT_PROJECTION_COLORS } from "../charts/chart-theme"
import { useSettings } from "@/frontend/context/SettingsContext"

interface ProjectionScenarioKPIsProps {
  scenarios: ProjectionScenario[]
  totalContributions: number
}

export function ProjectionScenarioKPIs({
  scenarios,
  totalContributions,
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Projected Wealth at Retirement</h3>
      <div className="grid gap-4">
        {scenarios.map(scenario => {
          const finalValue = scenario.dataPoints[scenario.dataPoints.length - 1].value
          const returns = calculateReturns(finalValue)
          const returnPercentage = (returns / totalContributions) * 100

          return (
            <Card key={scenario.type} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getScenarioColor(scenario.type) }}
                />
                <h4 className="font-medium capitalize">{scenario.type} Scenario</h4>
                <div className="text-sm text-muted-foreground ml-auto">
                  {scenario.returnRate ? `${scenario.returnRate.toFixed(1)}% return` : 'No return rate'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <span className="font-medium">{formatValue(finalValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Returns</span>
                  <span className="font-medium">{formatValue(returns)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Return on Investment</span>
                  <span className="font-medium">{returnPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Total Contributions</span>
          <span className="font-medium">{formatValue(totalContributions)}</span>
        </div>
      </div>
    </div>
  )
} 