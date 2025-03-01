"use client"

import { useState, useEffect } from "react"
import { ExtraContribution } from "@/frontend/types/pension"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/frontend/components/ui/table"
import { formatCurrency, formatDate } from "@/frontend/lib/transforms"
import { useSettings } from "@/frontend/context/SettingsContext"

interface ContributionHistoryTableProps {
  contributions: ExtraContribution[]
}

interface FormattedContribution {
  id: number
  date: string
  amount: string
  note: string
}

export function ContributionHistoryTable({ contributions }: ContributionHistoryTableProps) {
  const { settings } = useSettings()
  const [formattedContributions, setFormattedContributions] = useState<FormattedContribution[]>([])
  
  // Format values client-side only after hydration
  useEffect(() => {
    const formatted = contributions.map(contribution => ({
      id: contribution.id,
      date: formatDate(contribution.date, { locale: settings.ui_locale }).formatted,
      amount: formatCurrency(contribution.amount, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted,
      note: contribution.note || "-"
    }))
    
    // Sort contributions by date (newest first)
    const sortedContributions = [...formatted].sort((a, b) => {
      const dateA = new Date(contributions.find(c => c.id === a.id)?.date || 0)
      const dateB = new Date(contributions.find(c => c.id === b.id)?.date || 0)
      return dateB.getTime() - dateA.getTime()
    })
    
    setFormattedContributions(sortedContributions)
  }, [contributions, settings])
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Contribution History</h3>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedContributions.map((contribution) => (
              <TableRow key={contribution.id}>
                <TableCell>{contribution.date}</TableCell>
                <TableCell>{contribution.amount}</TableCell>
                <TableCell>{contribution.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 