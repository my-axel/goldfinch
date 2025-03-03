"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card"
import { useState } from "react"
import { YearlyInvestmentModal } from "./YearlyInvestmentModal"
import { CompanyPension, ExtraContribution } from "@/frontend/types/pension"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency } from "@/frontend/lib/transforms"
import { Badge } from "@/frontend/components/ui/badge"

interface ContributionHistoryCardProps {
  pension: CompanyPension
}

type GroupedContributions = {
  [year: string]: {
    [month: string]: ExtraContribution[]
  }
}

export function ContributionHistoryCard({ pension }: ContributionHistoryCardProps) {
  const [showAddContribution, setShowAddContribution] = useState(false)
  const { settings } = useSettings()
  const [refreshKey, setRefreshKey] = useState(0)

  // Group contributions by year and month
  const groupedContributions: GroupedContributions = {}
  
  // Sort contributions by date, newest first
  const sortedContributions = [...(pension.contribution_history || [])].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
  
  // Group by year and month
  sortedContributions.forEach(contribution => {
    const date = new Date(contribution.date)
    const year = date.getFullYear().toString()
    const month = date.toLocaleString('default', { month: 'long' })
    
    if (!groupedContributions[year]) {
      groupedContributions[year] = {}
    }
    
    if (!groupedContributions[year][month]) {
      groupedContributions[year][month] = []
    }
    
    groupedContributions[year][month].push(contribution)
  })
  
  // Get years in descending order
  const years = Object.keys(groupedContributions).sort((a, b) => parseInt(b) - parseInt(a))

  const handleContributionAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <Card key={refreshKey}>
        <CardHeader className="pb-7">
          <div className="space-y-1.5">
            <CardTitle>Contribution History</CardTitle>
            <CardDescription>
              View your past contributions to this pension plan
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sortedContributions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No contributions recorded yet.</p>
              <p className="text-sm mt-1">
                Contributions will appear here once they are recorded.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {years.map(year => (
                <div key={year} className="space-y-4">
                  <h3 className="font-semibold text-lg">{year}</h3>
                  
                  {Object.keys(groupedContributions[year]).map(month => (
                    <div key={`${year}-${month}`} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">{month}</h4>
                      
                      <div className="space-y-2">
                        {groupedContributions[year][month].map(contribution => (
                          <div 
                            key={contribution.id} 
                            className="grid grid-cols-[1fr_1fr_2fr] gap-4 text-sm py-2 border-t"
                          >
                            <div>{new Date(contribution.date).toLocaleDateString(settings.ui_locale)}</div>
                            <div>{formatCurrency(contribution.amount, {
                              locale: settings.number_locale,
                              currency: settings.currency
                            }).formatted}</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Manual</Badge>
                              {contribution.note && (
                                <span className="text-muted-foreground truncate">{contribution.note}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <YearlyInvestmentModal
        open={showAddContribution}
        onOpenChange={setShowAddContribution}
        pensionId={pension.id}
        onSuccess={handleContributionAdded}
      />
    </>
  )
} 