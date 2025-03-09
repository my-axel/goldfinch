"use client"

import { useState } from "react"
import { YearlyInvestmentModal } from "./YearlyInvestmentModal"
import { CompanyPension, ExtraContribution } from "@/frontend/types/pension"
import { FormattedCurrency } from "@/frontend/components/shared/formatting/FormattedCurrency"
import { FormattedDate } from "@/frontend/components/shared/formatting/FormattedDate"

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
  const [, setRefreshKey] = useState(0)

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
  
  const handleContributionAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <div>
        {Object.keys(groupedContributions).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No contributions recorded yet. Click &quot;Add Contribution&quot; to record a contribution.
          </div>
        ) : (
          <div>
            {Object.entries(groupedContributions).map(([year, months]) => (
              <div key={year} className="space-y-4">
                <h4 className="font-medium text-sm">{year}</h4>
                <div className="space-y-4 pl-4">
                  {Object.entries(months).map(([month, contributions]) => (
                    <div key={`${year}-${month}`} className="space-y-2">
                      <h5 className="text-sm text-muted-foreground">{month}</h5>
                      <div className="space-y-2 pl-4">
                        {contributions.map((contribution, index) => (
                          <div key={`${year}-${month}-${index}`} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                            <div className="text-sm">
                              <FormattedDate 
                                value={contribution.date} 
                                format={{ day: 'numeric', month: 'short' }}
                              />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                <FormattedCurrency value={contribution.amount} />
                              </span>
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
              </div>
            ))}
          </div>
        )}
      </div>
      
      <YearlyInvestmentModal
        open={showAddContribution}
        onOpenChange={setShowAddContribution}
        pensionId={pension.id}
        onSuccess={handleContributionAdded}
      />
    </>
  )
}