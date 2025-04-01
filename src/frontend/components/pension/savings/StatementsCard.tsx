"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { SavingsPensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { safeNumberValue } from "@/frontend/lib/transforms"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/components/ui/collapsible"
import { DateInput } from '@/frontend/components/ui/date-input'
import { useDateFormat } from "@/frontend/hooks/useDateFormat"
import { useSavingsPensionStatements } from '@/frontend/hooks/useSavingsPensions'
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
import { FormattedDate } from "@/frontend/components/shared/formatting/FormattedDate"
import { CurrencyInput } from "@/frontend/components/shared/inputs/CurrencyInput"
import { toDateObject } from '@/frontend/lib/dateUtils'

interface StatementsCardProps {
  form: UseFormReturn<SavingsPensionFormData>
  pensionId?: number
}

export function StatementsCard({ form, pensionId }: StatementsCardProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control: form.control,
    name: "statements"
  })
  
  const { formatDate } = useDateFormat()
  const { deleteStatement } = useSavingsPensionStatements()
  
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
  
  // Format dates for display
  useEffect(() => {
    const newFormattedDates: {[key: number]: string} = {}
    
    statementFields.forEach((field, index) => {
      const date = form.getValues(`statements.${index}.statement_date`)
      if (date) {
        newFormattedDates[index] = formatDate(date)
      }
    })
    
    setFormattedDates(newFormattedDates)
  }, [statementFields, form, formatDate])
  
  // Add a new statement
  const handleAddStatement = () => {
    const today = new Date()
    
    appendStatement({
      statement_date: today,
      balance: 0,
      note: ''
    })
    
    // Automatically expand the newly added statement
    const newIndex = statementFields.length
    setExpandedStatements({ ...expandedStatements, [newIndex]: true })
  }
  
  // Toggle expanded state for a statement
  const toggleExpanded = (index: number) => {
    setExpandedStatements({
      ...expandedStatements,
      [index]: !expandedStatements[index]
    })
  }
  
  // Confirm statement deletion
  const confirmDeleteStatement = (index: number) => {
    const date = formattedDates[index] || 'statement'
    setStatementToDelete({ index, date })
  }
  
  // Actually delete the statement
  const handleDeleteStatement = () => {
    if (statementToDelete === null) return
    
    const { index } = statementToDelete
    const statement = form.getValues(`statements.${index}`)
    
    // If the statement has an ID, it exists in the database
    if (statement.id && pensionId) {
      deleteStatement.mutate({ 
        pensionId, 
        statementId: statement.id 
      })
    }
    
    // Remove from form state
    removeStatement(index)
    
    // Reset state
    setStatementToDelete(null)
  }
  
  // Cancel statement deletion
  const cancelDelete = () => {
    setStatementToDelete(null)
  }
  
  // Render form fields for a statement
  const renderStatementForm = (index: number) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`statements.${index}.statement_date`}
          render={({ field }) => (
            <DateInput
              field={field}
              label="Statement Date"
            />
          )}
        />
        
        <FormField
          control={form.control}
          name={`statements.${index}.balance`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Balance</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name={`statements.${index}.note`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Note (Optional)</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                value={field.value || ''}
                placeholder="Add any notes about this statement"
                className="resize-none h-24"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
  
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
  
  // Render previous statements as collapsible items
  const renderPreviousStatements = () => {
    if (statementFields.length <= 1) return null;
    
    // Get all statements except the latest one
    const latestIndex = getLatestStatementIndex();
    const previousIndices = statementFields.map((_, index) => index).filter(index => index !== latestIndex);
    
    // Sort by date, most recent first
    const sortedIndices = [...previousIndices].sort((a, b) => {
      const dateA = form.getValues(`statements.${a}.statement_date`);
      const dateB = form.getValues(`statements.${b}.statement_date`);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Previous Statements</h3>
        <div className="space-y-3">
          {sortedIndices.map(index => {
            const date = form.getValues(`statements.${index}.statement_date`);
            const balance = safeNumberValue(form.getValues(`statements.${index}.balance`));
            
            return (
              <Collapsible
                key={statementFields[index].id}
                open={expandedStatements[index]}
                onOpenChange={() => toggleExpanded(index)}
                className="border rounded-md"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
                  <div className="flex items-center">
                    {expandedStatements[index] ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    <span>{date ? <FormattedDate value={date} /> : 'No date'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CurrencyInput
                      value={balance}
                      readOnly
                      onChange={() => {}}
                      className="text-right bg-transparent border-none h-6 pointer-events-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteStatement(index);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 pt-0 border-t">
                  {renderStatementForm(index)}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    );
  };

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
      <AlertDialog open={statementToDelete !== null} onOpenChange={(open) => !open && cancelDelete()}>
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
            <AlertDialogAction onClick={handleDeleteStatement} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 