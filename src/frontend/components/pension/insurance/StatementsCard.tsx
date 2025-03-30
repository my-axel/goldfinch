"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray, Path } from "react-hook-form"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/frontend/components/ui/input"
import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { getCurrencySymbol, safeNumberValue } from "@/frontend/lib/transforms"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/components/ui/collapsible"
import { DateInput } from '@/frontend/components/ui/date-input'
import { useDateFormat } from "@/frontend/hooks/useDateFormat"
import { usePension } from "@/frontend/context/pension"
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
// Import standardized formatting components
import { FormattedDate } from "@/frontend/components/shared/formatting/FormattedDate"
// Import standardized input components
import { CurrencyInput } from "@/frontend/components/shared/inputs/CurrencyInput"
import { PercentInput } from "@/frontend/components/shared/inputs/PercentInput"

interface StatementsCardProps {
  form: UseFormReturn<InsurancePensionFormData>
  pensionId?: number
}

type FormPath = 
  | `statements.${number}.value` 
  | `statements.${number}.total_contributions`
  | `statements.${number}.total_benefits`
  | `statements.${number}.costs_amount`
  | `statements.${number}.costs_percentage`
  | `statements.${number}.projections.${number}.return_rate`
  | `statements.${number}.projections.${number}.value_at_retirement`
  | `statements.${number}.projections.${number}.monthly_payout`
  | `statements.${number}.projections.${number}.scenario_type`
  | `statements.${number}.projections`

// Define a type for the projection to avoid repetition
type Projection = {
  scenario_type: 'with_contributions' | 'without_contributions';
  return_rate: number;
  value_at_retirement: number;
  monthly_payout: number;
};

export function StatementsCard({ form, pensionId }: StatementsCardProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control: form.control,
    name: "statements"
  })
  
  const { settings } = useSettings()
  const { deleteInsurancePensionStatement } = usePension()
  const { formatDate } = useDateFormat()
  
  const [expandedStatements, setExpandedStatements] = useState<{[key: number]: boolean}>({})
  const [formattedDates, setFormattedDates] = useState<{[key: number]: string}>({})
  const [statementToDelete, setStatementToDelete] = useState<{ index: number, date: string } | null>(null)
  // Add state to track projections and force re-renders
  const [statementsWithProjections, setStatementsWithProjections] = useState<{[key: number]: Projection[]}>({})
  const [projectionCounter, setProjectionCounter] = useState(0)
  
  const currencySymbol = getCurrencySymbol(settings.ui_locale, settings.currency)

  // Use a simpler approach - latest statement is the last one added
  const getLatestStatementIndex = () => {
    if (statementFields.length === 0) return -1
    return statementFields.length - 1
  }

  // Initialize dates when form data changes
  useEffect(() => {
    const statements = form.getValues("statements")
    if (statements) {
      // Initialize dates
      const newFormattedDates: {[key: number]: string} = {}
      const newStatementsWithProjections: {[key: number]: Projection[]} = {}
      
      statements.forEach((statement, index) => {
        if (statement.statement_date) {
          newFormattedDates[index] = formatDate(statement.statement_date)
        }
        
        // Initialize projections state
        newStatementsWithProjections[index] = statement.projections || []

        // Ensure all form values are properly set with numbers
        form.setValue(`statements.${index}.value` as Path<InsurancePensionFormData>, safeNumberValue(statement.value) ?? 0)
        form.setValue(`statements.${index}.total_contributions` as Path<InsurancePensionFormData>, safeNumberValue(statement.total_contributions) ?? 0)
        form.setValue(`statements.${index}.total_benefits` as Path<InsurancePensionFormData>, safeNumberValue(statement.total_benefits) ?? 0)
        form.setValue(`statements.${index}.costs_amount` as Path<InsurancePensionFormData>, safeNumberValue(statement.costs_amount) ?? 0)
        form.setValue(`statements.${index}.costs_percentage` as Path<InsurancePensionFormData>, safeNumberValue(statement.costs_percentage) ?? 0)

        statement.projections?.forEach((projection, projIndex) => {
          form.setValue(`statements.${index}.projections.${projIndex}.return_rate` as Path<InsurancePensionFormData>, safeNumberValue(projection.return_rate) ?? 0)
          form.setValue(`statements.${index}.projections.${projIndex}.value_at_retirement` as Path<InsurancePensionFormData>, safeNumberValue(projection.value_at_retirement) ?? 0)
          form.setValue(`statements.${index}.projections.${projIndex}.monthly_payout` as Path<InsurancePensionFormData>, safeNumberValue(projection.monthly_payout) ?? 0)
        })
      })
      
      setFormattedDates(newFormattedDates)
      setStatementsWithProjections(newStatementsWithProjections)
    }
  }, [form, formatDate])

  const handleAddStatement = () => {
    const statementDate = new Date()
    statementDate.setUTCHours(0, 0, 0, 0)
    
    appendStatement({
      statement_date: statementDate,
      value: 0,
      total_contributions: 0,
      total_benefits: 0,
      costs_amount: 0,
      costs_percentage: 0,
      note: "",
      projections: []
    })
    
    const newStatementIndex = statementFields.length
    setFormattedDates(prev => ({
      ...prev,
      [newStatementIndex]: formatDate(statementDate)
    }))
    
    // Initialize projections for the new statement
    setStatementsWithProjections(prev => ({
      ...prev,
      [newStatementIndex]: []
    }))
  }

  const handleAddProjection = (statementIndex: number) => {
    const statements = form.getValues("statements")
    if (!statements?.[statementIndex]) return

    const currentProjections = statements[statementIndex].projections || []
    const newProjection = {
      scenario_type: 'with_contributions' as const,
      return_rate: 0,
      value_at_retirement: 0,
      monthly_payout: 0
    }

    // Update form value
    form.setValue(`statements.${statementIndex}.projections` as Path<InsurancePensionFormData>, [...currentProjections, newProjection])
    
    // Update React state to trigger re-render
    setStatementsWithProjections(prev => ({
      ...prev,
      [statementIndex]: [...currentProjections, newProjection]
    }))
    
    // Force a re-render by incrementing counter
    setProjectionCounter(prev => prev + 1)
  }

  const handleRemoveProjection = (statementIndex: number, projectionIndex: number) => {
    const statements = form.getValues("statements")
    if (!statements?.[statementIndex]?.projections) return

    const currentProjections = [...statements[statementIndex].projections]
    currentProjections.splice(projectionIndex, 1)

    // Update form value
    form.setValue(`statements.${statementIndex}.projections` as Path<InsurancePensionFormData>, currentProjections)
    
    // Update React state to trigger re-render
    setStatementsWithProjections(prev => ({
      ...prev,
      [statementIndex]: currentProjections
    }))
    
    // Force a re-render by incrementing counter
    setProjectionCounter(prev => prev + 1)
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
        await deleteInsurancePensionStatement(pensionId, statement.id)
      } catch (error) {
        console.error('Error deleting statement:', error)
        return
      }
    }

    removeStatement(index)
    
    // Update projections state when removing a statement
    setStatementsWithProjections(prev => {
      const newState = { ...prev }
      delete newState[index]
      
      // Adjust indices for statements after the deleted one
      Object.keys(newState).forEach(key => {
        const keyNum = parseInt(key)
        if (keyNum > index) {
          newState[keyNum - 1] = newState[keyNum]
          delete newState[keyNum]
        }
      })
      
      return newState
    })
    
    setStatementToDelete(null)
  }

  const confirmDeleteStatement = (index: number) => {
    const date = formattedDates[index] || 'unknown date'
    setStatementToDelete({ index, date })
  }

  const renderStatementForm = (index: number) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
          name={`statements.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value ({currencySymbol})</FormLabel>
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

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`statements.${index}.total_contributions`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Contributions ({currencySymbol})</FormLabel>
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

        <FormField
          control={form.control}
          name={`statements.${index}.total_benefits`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Benefits ({currencySymbol})</FormLabel>
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

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`statements.${index}.costs_amount`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costs Amount ({currencySymbol})</FormLabel>
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

        <FormField
          control={form.control}
          name={`statements.${index}.costs_percentage`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costs Percentage (%)</FormLabel>
              <FormControl>
                <PercentInput
                  value={field.value !== undefined ? field.value / 100 : null} // Convert from percentage to decimal
                  onChange={(value) => field.onChange(value !== null ? value * 100 : null)} // Convert back to percentage
                  onBlur={field.onBlur}
                  min={0}
                  max={1} // 100%
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
              <Input {...field} value={field.value || ""} placeholder="Additional information about this statement" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <h5 className="font-medium text-sm">Retirement Projections</h5>
        </div>

        <div className="space-y-4">
          {statementsWithProjections[index]?.length > 0 && (
            <div className="grid grid-cols-[2fr_1fr_1.5fr_1.5fr_auto] gap-4 px-4">
              <div className="text-sm font-medium text-muted-foreground">Contribution</div>
              <div className="text-sm font-medium text-muted-foreground">Return Rate</div>
              <div className="text-sm font-medium text-muted-foreground">Value at Retirement</div>
              <div className="text-sm font-medium text-muted-foreground">Monthly Payout</div>
              <div className="w-9"></div>
            </div>
          )}

          {statementsWithProjections[index]?.map((projection, projectionIndex) => (
            <div key={`${projectionIndex}-${projectionCounter}`} className="grid grid-cols-[2fr_1fr_1.5fr_1.5fr_auto] gap-4 items-end p-4 rounded-lg bg-muted">
              <FormField
                control={form.control}
                name={`statements.${index}.projections.${projectionIndex}.scenario_type` as FormPath}
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <div className="flex w-full overflow-hidden rounded-md border">
                      <button
                        type="button"
                        className={`flex-1 px-2 py-1.5 text-xs font-medium ${field.value === 'with_contributions' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                        onClick={() => field.onChange('with_contributions')}
                        title="With Contributions"
                      >
                        With
                      </button>
                      <button
                        type="button"
                        className={`flex-1 px-2 py-1.5 text-xs font-medium ${field.value === 'without_contributions' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                        onClick={() => field.onChange('without_contributions')}
                        title="Without Contributions"
                      >
                        Without
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`statements.${index}.projections.${projectionIndex}.return_rate`}
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <PercentInput
                        value={field.value !== undefined ? field.value / 100 : null} // Convert from percentage to decimal
                        onChange={(value) => field.onChange(value !== null ? value * 100 : null)} // Convert back to percentage
                        onBlur={field.onBlur}
                        min={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`statements.${index}.projections.${projectionIndex}.value_at_retirement`}
                render={({ field }) => (
                  <FormItem className="space-y-0">
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

              <FormField
                control={form.control}
                name={`statements.${index}.projections.${projectionIndex}.monthly_payout`}
                render={({ field }) => (
                  <FormItem className="space-y-0">
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

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveProjection(index, projectionIndex)}
                className="h-9 w-9 self-end"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed text-center py-6 text-sm text-muted-foreground border-2 rounded-lg"
            onClick={() => handleAddProjection(index)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {statementsWithProjections[index]?.length === 0
              ? "No projections yet. Click to add your first projection."
              : "Add Projection"}
          </Button>
        </div>
      </div>
    </div>
  )

  // Render previous statements as collapsible items
  const renderPreviousStatements = () => {
    if (statementFields.length <= 1) return null;
    
    // Get all statements except the latest one
    const previousStatements = statementFields.slice(0, -1);
    
    // Sort previous statements by date (latest on top)
    const sortedPreviousStatements = [...previousStatements].sort((a, b) => {
      const dateA = new Date(form.getValues(`statements.${previousStatements.indexOf(a)}.statement_date`)).getTime();
      const dateB = new Date(form.getValues(`statements.${previousStatements.indexOf(b)}.statement_date`)).getTime();
      return dateB - dateA; // Sort in descending order (latest first)
    });
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Previous Statements</h3>
        {sortedPreviousStatements.map((field) => {
          // Get the original index to access the correct data
          const originalIndex = previousStatements.indexOf(field);
          
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

  // Render the latest statement form (the one with the highest index)
  const renderLatestStatementForm = () => {
    if (statementFields.length === 0) return null;
    
    const latestIndex = getLatestStatementIndex();
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Latest Statement</h3>
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
  )
} 