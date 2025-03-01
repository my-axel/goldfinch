"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { CompanyPension, PensionCompanyRetirementProjection } from "@/frontend/types/pension"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency } from "@/frontend/lib/transforms"
import { useState, useEffect } from "react"

interface ProjectionsCardProps {
  pension: CompanyPension
}

export function ProjectionsCard({ pension }: ProjectionsCardProps) {
  const { settings } = useSettings()
  const [formattedProjections, setFormattedProjections] = useState<PensionCompanyRetirementProjection[]>([])

  // Get all projections from all statements and sort by retirement age
  useEffect(() => {
    const allProjections: PensionCompanyRetirementProjection[] = []
    
    // Collect projections from all statements
    pension.statements?.forEach(statement => {
      if (statement.retirement_projections) {
        allProjections.push(...statement.retirement_projections)
      }
    })
    
    // Sort by retirement age
    const sorted = [...allProjections].sort((a, b) => {
      return a.retirement_age - b.retirement_age
    })
    
    setFormattedProjections(sorted)
  }, [pension])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Retirement Projections</CardTitle>
      </CardHeader>
      <CardContent>
        {formattedProjections.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No projections available.</p>
            <p className="text-sm mt-1">
              Add projections in the pension settings to see your retirement outlook.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 font-medium text-sm text-muted-foreground">
              <div>Retirement Age</div>
              <div>Monthly Payout</div>
              <div>Total Capital</div>
            </div>
            {formattedProjections.map((projection) => (
              <div 
                key={projection.id} 
                className="grid grid-cols-3 gap-4 text-sm py-2 border-t"
              >
                <div>{projection.retirement_age}</div>
                <div>{formatCurrency(projection.monthly_payout, {
                  locale: settings.number_locale,
                  currency: settings.currency
                }).formatted}</div>
                <div>{formatCurrency(projection.total_capital, {
                  locale: settings.number_locale,
                  currency: settings.currency
                }).formatted}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 