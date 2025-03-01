"use client"

import { useState, useEffect } from "react"
import { PensionCompanyStatement } from "@/frontend/types/pension"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Button } from "@/frontend/components/ui/button"
import { Plus, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/components/ui/collapsible"
import { Badge } from "@/frontend/components/ui/badge"
import { formatCurrency, formatDate } from "@/frontend/lib/transforms"
import { useSettings } from "@/frontend/context/SettingsContext"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/frontend/components/ui/dialog"
import { AddStatementForm } from "./AddStatementForm"
import { usePension } from "@/frontend/context/PensionContext"

interface StatementsListProps {
  pensionId: number
  statements: PensionCompanyStatement[]
  onAddStatement?: () => void
}

// Define types for formatted values
interface FormattedProjection {
  monthly: string
  total: string
}

interface FormattedStatement {
  value: string
  date: string
  projections: Record<number, FormattedProjection>
}

export function StatementsList({ pensionId, statements, onAddStatement }: StatementsListProps) {
  const [openStatements, setOpenStatements] = useState<Record<number, boolean>>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { settings } = useSettings()
  const { createCompanyPensionStatement } = usePension()
  
  // State for formatted values to avoid hydration mismatches
  const [formattedValues, setFormattedValues] = useState<Record<number, FormattedStatement>>({})

  // Format values client-side only after hydration
  useEffect(() => {
    const newFormattedValues: Record<number, FormattedStatement> = {}
    
    statements.forEach(statement => {
      const projections: Record<number, FormattedProjection> = {}
      
      if (statement.retirement_projections) {
        statement.retirement_projections.forEach(projection => {
          projections[projection.id] = {
            monthly: formatCurrency(projection.monthly_payout, {
              locale: settings.number_locale,
              currency: settings.currency
            }).formatted,
            total: formatCurrency(projection.total_capital, {
              locale: settings.number_locale,
              currency: settings.currency
            }).formatted
          }
        })
      }
      
      newFormattedValues[statement.id] = {
        value: formatCurrency(statement.value, {
          locale: settings.number_locale,
          currency: settings.currency
        }).formatted,
        date: formatDate(new Date(statement.statement_date), {
          locale: settings.number_locale
        }).formatted,
        projections
      }
    })
    
    setFormattedValues(newFormattedValues)
  }, [statements, settings])

  const toggleStatement = (statementId: number) => {
    setOpenStatements(prev => ({
      ...prev,
      [statementId]: !prev[statementId]
    }))
  }

  const handleAddStatement = async (data: {
    statement_date: Date
    value: number
    note?: string
    retirement_projections?: Array<{
      retirement_age: number
      monthly_payout: number
      total_capital: number
    }>
  }) => {
    try {
      await createCompanyPensionStatement(pensionId, {
        statement_date: data.statement_date.toISOString().split('T')[0],
        value: data.value,
        note: data.note,
        retirement_projections: data.retirement_projections
      })
      setIsAddDialogOpen(false)
      if (onAddStatement) onAddStatement()
    } catch (error) {
      console.error("Failed to add statement:", error)
    }
  }

  // Sort statements by date (newest first)
  const sortedStatements = [...statements].sort((a, b) => 
    new Date(b.statement_date).getTime() - new Date(a.statement_date).getTime()
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Pension Statements</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Statement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Pension Statement</DialogTitle>
              <DialogDescription>
                Add a new statement with the current value and retirement projections.
              </DialogDescription>
            </DialogHeader>
            <AddStatementForm onSubmit={handleAddStatement} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {sortedStatements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>No statements yet</p>
          <p className="text-sm">Add a statement to track your pension value over time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedStatements.map((statement) => (
            <Collapsible
              key={statement.id}
              open={openStatements[statement.id]}
              onOpenChange={() => toggleStatement(statement.id)}
              className="border rounded-lg"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formattedValues[statement.id]?.date || ""}
                    </span>
                    {statement.id === sortedStatements[0].id && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <span className="text-lg font-semibold">
                    {formattedValues[statement.id]?.value || "0"}
                  </span>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {openStatements[statement.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t pt-3">
                  {statement.note && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Note</h4>
                      <p className="text-sm text-muted-foreground">{statement.note}</p>
                    </div>
                  )}
                  
                  {statement.retirement_projections && statement.retirement_projections.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Retirement Projections</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {statement.retirement_projections.map((projection) => (
                          <Card key={projection.id} className="bg-muted/50">
                            <CardHeader className="py-3 px-4">
                              <CardTitle className="text-sm">Age {projection.retirement_age}</CardTitle>
                            </CardHeader>
                            <CardContent className="py-2 px-4">
                              <div className="space-y-1">
                                <div>
                                  <span className="text-xs text-muted-foreground">Monthly:</span>
                                  <p className="font-medium">
                                    {formattedValues[statement.id]?.projections[projection.id]?.monthly || "0"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Total Capital:</span>
                                  <p className="font-medium">
                                    {formattedValues[statement.id]?.projections[projection.id]?.total || "0"}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No retirement projections available</p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  )
} 