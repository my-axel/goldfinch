"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray, Path } from "react-hook-form"
import { StatePensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { safeNumberValue } from "@/frontend/lib/transforms"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/components/ui/collapsible"
import { DateInput } from '@/frontend/components/ui/date-input'
import { useDateFormat } from "@/frontend/hooks/useDateFormat"
import { useDeleteStatePensionStatement } from '@/frontend/hooks/pension/useStatePensions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/frontend/components/ui/alert-dialog"
import { Textarea } from "@/frontend/components/ui/textarea"
// Import standardized formatting components
import { FormattedDate } from "@/frontend/components/shared/formatting/FormattedDate"
// Import standardized input components
import { CurrencyInput } from "@/frontend/components/shared/inputs/CurrencyInput"
import { toDateObject } from '@/frontend/lib/dateUtils'

interface StatementsCardProps {
  form: UseFormReturn<StatePensionFormData>
  pensionId?: number
}

export function StatementsCard({ form, pensionId }: StatementsCardProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control: form.control,
    name: "statements"
  })
  
  const { formatDate } = useDateFormat()
  const { mutate: deleteStatement } = useDeleteStatePensionStatement()
  
  const [expandedStatements, setExpandedStatements] = useState<{[key: number]: boolean}>({})
  const [formattedDates, setFormattedDates] = useState<{[key: number]: string}>({})
  const [statementToDelete, setStatementToDelete] = useState<{ index: number, date: string } | null>(null)

  // Get the index of the latest statement by date
  const getLatestStatementIndex = () => {
    if (statementFields.length === 0) return -1
    
    // Find the index of the statement with the most recent date
    let latestIndex = 0
    let latestDate = new Date(0) // Start with earliest possible date
    
    statementFields.forEach((field, index) => {
      const rawDate = form.getValues(`statements.${index}.statement_date`)
      const statementDate = toDateObject(rawDate)
      
      if (statementDate && (statementDate > latestDate)) {
        latestDate = statementDate
        latestIndex = index
      }
    })
    
    return latestIndex
  }

  // Initialize dates when form data changes
  useEffect(() => {
    const statements = form.getValues("statements")
    if (statements) {
      // Initialize dates
      const newFormattedDates: {[key: number]: string} = {}
      
      statements.forEach((statement, index) => {
        if (statement.statement_date) {
          newFormattedDates[index] = formatDate(statement.statement_date)
        }
        
        // Ensure all form values are properly set with numbers
        form.setValue(`statements.${index}.current_monthly_amount` as Path<StatePensionFormData>, safeNumberValue(statement.current_monthly_amount) ?? 0)
        form.setValue(`statements.${index}.projected_monthly_amount` as Path<StatePensionFormData>, safeNumberValue(statement.projected_monthly_amount) ?? 0)
        form.setValue(`statements.${index}.current_value` as Path<StatePensionFormData>, safeNumberValue(statement.current_value) ?? 0)
      })
      
      setFormattedDates(newFormattedDates)
    }
  }, [form, formatDate])

  const handleAddStatement = () => {
    const statementDate = new Date()
    statementDate.setUTCHours(0, 0, 0, 0)
    
    appendStatement({
      statement_date: statementDate,
      current_monthly_amount: 0,
      projected_monthly_amount: 0,
      current_value: 0,
      note: ""
    })
    
    const newStatementIndex = statementFields.length
    setFormattedDates(prev => ({
      ...prev,
      [newStatementIndex]: formatDate(statementDate)
    }))
  }

  const toggleStatement = (index: number) => {
    setExpandedStatements(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const handleRemoveStatement = async (index: number) => {
    const statements = form.getValues("statements")
    const statement = statements?.[index]

    if (pensionId && statement?.id) {
      try {
        await deleteStatement({ pensionId, statementId: statement.id })
      } catch (error) {
        console.error('Error deleting statement:', error)
        return
      }
    }

    removeStatement(index)
    setStatementToDelete(null)
  }

  const confirmDeleteStatement = (index: number) => {
    const date = formattedDates[index] || 'unknown date'
    setStatementToDelete({ index, date })
  }

  const renderStatementForm = (index: number) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`statements.${index}.statement_date`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statement Date</FormLabel>
              <FormControl>
                <DateInput field={field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`statements.${index}.current_value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Value</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`statements.${index}.current_monthly_amount`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Monthly Amount</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`statements.${index}.projected_monthly_amount`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projected Monthly Amount</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name={`statements.${index}.note`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Add any notes about this statement"
                  className="resize-none h-24"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )

  // Render previous statements as collapsible items
  const renderPreviousStatements = () => {
    if (statementFields.length <= 1) return null;
    
    const latestIndex = getLatestStatementIndex();
    
    // Get all statements except the latest one by date
    const previousStatements = statementFields.filter((_, index) => index !== latestIndex);
    
    // Sort previous statements by date (latest on top)
    const sortedPreviousStatements = [...previousStatements].sort((a, b) => {
      const indexA = statementFields.findIndex(field => field.id === a.id);
      const indexB = statementFields.findIndex(field => field.id === b.id);
      const dateA = new Date(form.getValues(`statements.${indexA}.statement_date`)).getTime();
      const dateB = new Date(form.getValues(`statements.${indexB}.statement_date`)).getTime();
      return dateB - dateA; // Sort in descending order (latest first)
    });
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Previous Statements</h3>
        {sortedPreviousStatements.map((field) => {
          // Get the original index to access the correct data
          const originalIndex = statementFields.findIndex(f => f.id === field.id);
          
          return (
            <Collapsible
              key={field.id}
              open={expandedStatements[originalIndex]}
              onOpenChange={() => toggleStatement(originalIndex)}
              className="border rounded-md overflow-hidden"
            >
              <div className="p-4 flex justify-between items-center bg-muted/30">
                <CollapsibleTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="p-0 h-auto flex items-center gap-2 hover:bg-transparent"
                  >
                    {expandedStatements[originalIndex] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <h4 className="font-medium">
                      Statement from <FormattedDate value={form.getValues(`statements.${originalIndex}.statement_date`)} />
                    </h4>
                  </Button>
                </CollapsibleTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => confirmDeleteStatement(originalIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CollapsibleContent className="p-4">
                {renderStatementForm(originalIndex)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  }

  // Render the latest statement form (the one with the most recent date)
  const renderLatestStatementForm = () => {
    if (statementFields.length === 0) return null;
    
    const latestIndex = getLatestStatementIndex();
    
    // Get the date string for display
    const statementDate = form.getValues(`statements.${latestIndex}.statement_date`);
    const formattedDate = statementDate ? <FormattedDate value={statementDate} /> : "latest statement";
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Latest Statement ({formattedDate})</h3>
        <div className="p-4 border rounded-md">
          {renderStatementForm(latestIndex)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Statement Button - Shown at top when statements exist */}
      {statementFields.length > 0 && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed text-center py-6 text-sm text-muted-foreground border-2 rounded-lg"
          onClick={handleAddStatement}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add a new statement
        </Button>
      )}

      {/* Latest Statement Form */}
      {renderLatestStatementForm()}

      {/* Previous Statements */}
      {renderPreviousStatements()}

      {/* Empty State */}
      {statementFields.length === 0 && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed text-center py-6 text-sm text-muted-foreground border-2 rounded-lg"
          onClick={handleAddStatement}
        >
          <Plus className="h-4 w-4 mr-2" />
          No statements added yet. Click to add your first statement.
        </Button>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!statementToDelete}
        onOpenChange={() => setStatementToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Statement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the statement from {statementToDelete?.date}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (statementToDelete) {
                  handleRemoveStatement(statementToDelete.index)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 