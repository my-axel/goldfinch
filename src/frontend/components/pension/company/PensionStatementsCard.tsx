"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { CompanyPensionFormData, RetirementProjection } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/frontend/components/ui/input"
import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator, getCurrencySymbol } from "@/frontend/lib/transforms"
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

interface PensionStatementsCardProps {
  form: UseFormReturn<CompanyPensionFormData>
  pensionId?: number
}

/**
 * Component for managing pension statements and retirement projections.
 * Handles adding, editing, and removing statements and their associated projections.
 */
export function PensionStatementsCard({ form, pensionId }: PensionStatementsCardProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control: form.control,
    name: "statements"
  })
  
  const { settings } = useSettings()
  const { deleteCompanyPensionStatement } = usePension()
  const { formatDate } = useDateFormat()
  const [statementValueInputs, setStatementValueInputs] = useState<string[]>([])
  const [projectionInputs, setProjectionInputs] = useState<{[key: string]: string}>({})
  const [statementsWithProjections, setStatementsWithProjections] = useState<{[key: number]: RetirementProjection[]}>({})
  const [projectionCounter, setProjectionCounter] = useState(0)
  const [expandedStatements, setExpandedStatements] = useState<{[key: number]: boolean}>({})
  const [formattedDates, setFormattedDates] = useState<{[key: number]: string}>({})
  const [statementToDelete, setStatementToDelete] = useState<{ index: number, date: string } | null>(null)
  const decimalSeparator = getDecimalSeparator(settings.number_locale)
  const currencySymbol = getCurrencySymbol(settings.number_locale, settings.currency)

  // Initialize input states when form data changes
  useEffect(() => {
    const statements = form.getValues("statements");
    
    // Initialize statement value inputs and projections
    if (statements && statements.length > 0) {
      const newStatementValueInputs = statements.map(statement => 
        statement.value ? statement.value.toString().replace('.', decimalSeparator) : ""
      );
      setStatementValueInputs(newStatementValueInputs);
      
      // Initialize projection inputs for each statement
      const newProjectionInputs: {[key: string]: string} = {};
      const newStatementsWithProjections: {[key: number]: RetirementProjection[]} = {};
      
      statements.forEach((statement, statementIndex) => {
        if (!statement.retirement_projections) {
          form.setValue(`statements.${statementIndex}.retirement_projections`, [], {
            shouldValidate: false,
            shouldDirty: false
          });
          newStatementsWithProjections[statementIndex] = [];
        } else {
          statement.retirement_projections.forEach((projection, projectionIndex) => {
            newProjectionInputs[`${statementIndex}.${projectionIndex}.monthly_payout`] = projection.monthly_payout 
              ? projection.monthly_payout.toString().replace('.', decimalSeparator) 
              : "";
            newProjectionInputs[`${statementIndex}.${projectionIndex}.total_capital`] = projection.total_capital 
              ? projection.total_capital.toString().replace('.', decimalSeparator) 
              : "";
          });
          newStatementsWithProjections[statementIndex] = [...statement.retirement_projections];
        }
      });
      
      setProjectionInputs(newProjectionInputs);
      setStatementsWithProjections(newStatementsWithProjections);
    }
  }, [form, decimalSeparator]);

  // Format dates when form data changes
  useEffect(() => {
    const statements = form.getValues("statements");
    if (statements) {
      const newFormattedDates: {[key: number]: string} = {};
      statements.forEach((statement, index) => {
        if (statement.statement_date) {
          newFormattedDates[index] = formatDate(statement.statement_date);
        }
      });
      setFormattedDates(newFormattedDates);
    }
  }, [form, formatDate]);

  // Validate if the input is a valid number format
  const isValidNumberFormat = (value: string): boolean => {
    if (!value) return true
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
  }

  const handleAddStatement = () => {
    const statementDate = new Date();
    statementDate.setUTCHours(0, 0, 0, 0);
    
    appendStatement({
      statement_date: statementDate,
      value: 0,
      note: "",
      retirement_projections: []
    })
    
    setStatementValueInputs([...statementValueInputs, "0"])
    
    const newStatementIndex = statementFields.length;
    setStatementsWithProjections(prev => ({
      ...prev,
      [newStatementIndex]: []
    }));

    // Format and set the date for the new statement
    setFormattedDates(prev => ({
      ...prev,
      [newStatementIndex]: formatDate(statementDate)
    }));
  }

  const handleAddProjectionToStatement = (statementIndex: number) => {
    const formValues = form.getValues() as CompanyPensionFormData;
    
    if (!formValues.statements || !formValues.statements[statementIndex]) {
      return;
    }
    
    const currentProjections = Array.isArray(formValues.statements[statementIndex].retirement_projections) 
      ? [...formValues.statements[statementIndex].retirement_projections] 
      : [];
    
    const newProjection = {
      retirement_age: 67,
      monthly_payout: 0,
      total_capital: 0
    };
    
    const updatedProjections = [...currentProjections, newProjection];
    
    form.setValue(`statements.${statementIndex}.retirement_projections`, updatedProjections, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    const projectionIndex = updatedProjections.length - 1;
    
    setProjectionInputs({
      ...projectionInputs,
      [`${statementIndex}.${projectionIndex}.monthly_payout`]: "0",
      [`${statementIndex}.${projectionIndex}.total_capital`]: "0"
    });
    
    setProjectionCounter(prev => prev + 1);
    
    setStatementsWithProjections(prev => ({
      ...prev,
      [statementIndex]: updatedProjections
    }));
    
    setTimeout(() => {
      form.trigger();
    }, 0);
  }

  const handleRemoveProjection = (statementIndex: number, projectionIndex: number) => {
    const formValues = form.getValues() as CompanyPensionFormData;
    
    if (!formValues.statements || !formValues.statements[statementIndex]) {
      return;
    }
    
    const currentProjections = Array.isArray(formValues.statements[statementIndex].retirement_projections) 
      ? [...formValues.statements[statementIndex].retirement_projections] 
      : [];
    
    if (currentProjections.length === 0) {
      return;
    }
    
    currentProjections.splice(projectionIndex, 1);
    
    form.setValue(`statements.${statementIndex}.retirement_projections`, currentProjections, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    const newProjectionInputs = { ...projectionInputs };
    delete newProjectionInputs[`${statementIndex}.${projectionIndex}.monthly_payout`];
    delete newProjectionInputs[`${statementIndex}.${projectionIndex}.total_capital`];
    
    for (let i = projectionIndex + 1; i < currentProjections.length + 1; i++) {
      if (newProjectionInputs[`${statementIndex}.${i}.monthly_payout`]) {
        newProjectionInputs[`${statementIndex}.${i-1}.monthly_payout`] = newProjectionInputs[`${statementIndex}.${i}.monthly_payout`];
        delete newProjectionInputs[`${statementIndex}.${i}.monthly_payout`];
      }
      
      if (newProjectionInputs[`${statementIndex}.${i}.total_capital`]) {
        newProjectionInputs[`${statementIndex}.${i-1}.total_capital`] = newProjectionInputs[`${statementIndex}.${i}.total_capital`];
        delete newProjectionInputs[`${statementIndex}.${i}.total_capital`];
      }
    }
    
    setProjectionInputs(newProjectionInputs);
    setProjectionCounter(prev => prev + 1);
    
    setStatementsWithProjections(prev => ({
      ...prev,
      [statementIndex]: currentProjections
    }));
    
    setTimeout(() => {
      form.trigger();
    }, 0);
  }

  const toggleStatement = (index: number) => {
    setExpandedStatements(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleRemoveStatement = async (index: number) => {
    const currentFormData = form.getValues()
    const statements = currentFormData.statements || []
    const statement = statements[index]
    
    // If the statement has an ID and we have a pensionId, it exists in the database and needs to be deleted
    if (statement?.id && pensionId) {
      try {
        await deleteCompanyPensionStatement(pensionId, statement.id)
      } catch {
        // Error is handled by the context
        return
      }
    }
    
    // Remove the statement from the form state
    removeStatement(index)
    
    // Update all state using the current form data to ensure consistency
    const updatedFormData = form.getValues()
    const updatedStatements = updatedFormData.statements || []
    
    // Reset all state based on current form data
    setStatementValueInputs(
      updatedStatements.map(statement => 
        statement.value ? statement.value.toString().replace('.', decimalSeparator) : ""
      )
    )
    
    // Reset projections state
    const newProjectionInputs: {[key: string]: string} = {}
    const newStatementsWithProjections: {[key: number]: RetirementProjection[]} = {}
    
    updatedStatements.forEach((statement, idx) => {
      if (statement.retirement_projections) {
        statement.retirement_projections.forEach((projection, projIdx) => {
          newProjectionInputs[`${idx}.${projIdx}.monthly_payout`] = 
            projection.monthly_payout ? projection.monthly_payout.toString().replace('.', decimalSeparator) : ""
          newProjectionInputs[`${idx}.${projIdx}.total_capital`] = 
            projection.total_capital ? projection.total_capital.toString().replace('.', decimalSeparator) : ""
        })
        newStatementsWithProjections[idx] = [...statement.retirement_projections]
      } else {
        newStatementsWithProjections[idx] = []
      }
    })
    
    setProjectionInputs(newProjectionInputs)
    setStatementsWithProjections(newStatementsWithProjections)
    
    // Reset formatted dates
    const newFormattedDates: {[key: number]: string} = {}
    updatedStatements.forEach((statement, idx) => {
      if (statement.statement_date) {
        newFormattedDates[idx] = formatDate(statement.statement_date)
      }
    })
    setFormattedDates(newFormattedDates)
    
    // Explicitly set the statements array in the form to ensure the change is tracked
    form.setValue('statements', updatedStatements, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    })

    // Force the form to recognize the change
    form.trigger('statements')
    
    // Clear the statement to delete
    setStatementToDelete(null)
  }

  const confirmDeleteStatement = (index: number) => {
    const statement = form.getValues().statements?.[index]
    if (statement) {
      setStatementToDelete({
        index,
        date: formatDate(statement.statement_date)
      })
    }
  }

  // Render the latest statement form (the one with the highest index)
  const renderLatestStatementForm = () => {
    if (statementFields.length === 0) return null;
    
    const latestIndex = statementFields.length - 1;
    const latestField = statementFields[latestIndex];
    
    return (
      <div key={latestField.id} className="space-y-4 p-4 border rounded-md">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Latest Statement</h4>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => confirmDeleteStatement(latestIndex)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`statements.${latestIndex}.statement_date`}
            render={({ field }) => (
              <DateInput
                field={field}
                label="Statement Date"
              />
            )}
          />

          <FormField
            control={form.control}
            name={`statements.${latestIndex}.value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value ({currencySymbol})</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={statementValueInputs[latestIndex] || ""}
                      onChange={(e) => {
                        const newValue = e.target.value
                        if (isValidNumberFormat(newValue)) {
                          const newInputs = [...statementValueInputs]
                          newInputs[latestIndex] = newValue
                          setStatementValueInputs(newInputs)
                          
                          const parsedValue = parseNumber(newValue, settings.number_locale)
                          if (parsedValue >= 0) {
                            field.onChange(parsedValue)
                          }
                        }
                      }}
                      onBlur={() => {
                        const value = parseNumber(statementValueInputs[latestIndex] || "", settings.number_locale)
                        if (value >= 0) {
                          const newInputs = [...statementValueInputs]
                          newInputs[latestIndex] = value.toString().replace('.', decimalSeparator)
                          setStatementValueInputs(newInputs)
                          field.onChange(value)
                        } else {
                          const newInputs = [...statementValueInputs]
                          newInputs[latestIndex] = ""
                          setStatementValueInputs(newInputs)
                          field.onChange(0)
                        }
                        field.onBlur()
                      }}
                      placeholder={`0${decimalSeparator}00`}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`statements.${latestIndex}.note`}
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Additional information about this statement" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-medium text-sm">Retirement Projections</h5>
          </div>
          
          <div className="relative">
            {(() => {
              const projections = statementsWithProjections[latestIndex] || 
                form.getValues()?.statements?.[latestIndex]?.retirement_projections || [];
              
              if (projections.length > 0) {
                return (
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 mb-2 px-2">
                    <div className="text-sm font-medium text-muted-foreground">Retirement Age</div>
                    <div className="text-sm font-medium text-muted-foreground">Monthly Payout</div>
                    <div className="text-sm font-medium text-muted-foreground">Total Capital</div>
                    <div className="w-9"></div>
                  </div>
                );
              }
              
              return null;
            })()}
            
            <div className="space-y-2">
              {(() => {
                const projections = statementsWithProjections[latestIndex] || 
                  form.getValues()?.statements?.[latestIndex]?.retirement_projections || [];
                
                return Array.isArray(projections) ? projections.map((projection, projectionIndex) => (
                  <div key={`${latestIndex}-${projectionIndex}-${projectionCounter}`} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-2 pt-1 rounded-lg bg-muted">
                    <FormField
                      control={form.control}
                      name={`statements.${latestIndex}.retirement_projections.${projectionIndex}.retirement_age`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input 
                              type="number" 
                              min="50" 
                              max="100" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 67)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`statements.${latestIndex}.retirement_projections.${projectionIndex}.monthly_payout`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={projectionInputs[`${latestIndex}.${projectionIndex}.monthly_payout`] || ""}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  if (isValidNumberFormat(newValue)) {
                                    setProjectionInputs({
                                      ...projectionInputs,
                                      [`${latestIndex}.${projectionIndex}.monthly_payout`]: newValue
                                    })
                                    
                                    const parsedValue = parseNumber(newValue, settings.number_locale)
                                    if (parsedValue >= 0) {
                                      field.onChange(parsedValue)
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const value = parseNumber(projectionInputs[`${latestIndex}.${projectionIndex}.monthly_payout`] || "", settings.number_locale)
                                  if (value >= 0) {
                                    setProjectionInputs({
                                      ...projectionInputs,
                                      [`${latestIndex}.${projectionIndex}.monthly_payout`]: value.toString().replace('.', decimalSeparator)
                                    })
                                    field.onChange(value)
                                  } else {
                                    setProjectionInputs({
                                      ...projectionInputs,
                                      [`${latestIndex}.${projectionIndex}.monthly_payout`]: ""
                                    })
                                    field.onChange(0)
                                  }
                                  field.onBlur()
                                }}
                                placeholder={`0${decimalSeparator}00`}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`statements.${latestIndex}.retirement_projections.${projectionIndex}.total_capital`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={projectionInputs[`${latestIndex}.${projectionIndex}.total_capital`] || ""}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  if (isValidNumberFormat(newValue)) {
                                    setProjectionInputs({
                                      ...projectionInputs,
                                      [`${latestIndex}.${projectionIndex}.total_capital`]: newValue
                                    })
                                    
                                    const parsedValue = parseNumber(newValue, settings.number_locale)
                                    if (parsedValue >= 0) {
                                      field.onChange(parsedValue)
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const value = parseNumber(projectionInputs[`${latestIndex}.${projectionIndex}.total_capital`] || "", settings.number_locale)
                                  if (value >= 0) {
                                    setProjectionInputs({
                                      ...projectionInputs,
                                      [`${latestIndex}.${projectionIndex}.total_capital`]: value.toString().replace('.', decimalSeparator)
                                    })
                                    field.onChange(value)
                                  } else {
                                    setProjectionInputs({
                                      ...projectionInputs,
                                      [`${latestIndex}.${projectionIndex}.total_capital`]: ""
                                    })
                                    field.onChange(0)
                                  }
                                  field.onBlur()
                                }}
                                placeholder={`0${decimalSeparator}00`}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveProjection(latestIndex, projectionIndex)}
                      className="h-9 w-9 self-end"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )) : null;
              })()}
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed text-center py-6 text-sm text-muted-foreground border-2 rounded-lg"
                onClick={() => handleAddProjectionToStatement(latestIndex)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {(() => {
                  const projections = statementsWithProjections[latestIndex] || 
                    form.getValues()?.statements?.[latestIndex]?.retirement_projections || [];
                  
                  return projections.length === 0 ? (
                    <span>No retirement projections yet. Click to add your first projection.</span>
                  ) : (
                    <span>Add Projection</span>
                  );
                })()}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render previous statements as collapsible items
  const renderPreviousStatements = () => {
    if (statementFields.length <= 1) return null;
    
    // Get all statements except the latest one
    const previousStatements = statementFields.slice(0, -1);
    
    return (
      <div className="mt-8 space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">Previous Statements</h4>
        {previousStatements.map((statementField, index) => {
          // Get the actual form data for this statement
          const statement = form.getValues().statements?.[index];
          if (!statement) return null;
          
          return (
            <Collapsible
              key={statementField.id}
              open={expandedStatements[index]}
              onOpenChange={() => toggleStatement(index)}
              className="border rounded-md overflow-hidden"
            >
              <div className="p-4 flex justify-between items-center bg-muted/30">
                <CollapsibleTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="p-0 h-auto flex items-center gap-2 hover:bg-transparent"
                  >
                    {expandedStatements[index] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <h4 className="font-medium">
                      Statement from {formattedDates[index] || 'Unknown date'}
                    </h4>
                  </Button>
                </CollapsibleTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => confirmDeleteStatement(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <CollapsibleContent>
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      name={`statements.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value ({currencySymbol})</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={statementValueInputs[index] || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (isValidNumberFormat(value)) {
                                    const newInputs = [...statementValueInputs];
                                    newInputs[index] = value;
                                    setStatementValueInputs(newInputs);
                                    
                                    const parsedValue = parseNumber(value, settings.number_locale);
                                    field.onChange(parsedValue);
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  const parsedValue = parseNumber(value, settings.number_locale);
                                  const formattedValue = parsedValue.toString().replace('.', decimalSeparator);
                                  
                                  const newInputs = [...statementValueInputs];
                                  newInputs[index] = formattedValue;
                                  setStatementValueInputs(newInputs);
                                  
                                  field.onChange(parsedValue);
                                }}
                                placeholder={`0${decimalSeparator}00`}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`statements.${index}.note`}
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Note</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Additional information about this statement" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-medium text-sm">Retirement Projections</h5>
                    </div>
                    
                    <div className="relative">
                      {(() => {
                        const projections = statementsWithProjections[index] || 
                          form.getValues()?.statements?.[index]?.retirement_projections || [];
                        
                        if (projections.length > 0) {
                          return (
                            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 mb-2 px-2">
                              <div className="text-sm font-medium text-muted-foreground">Retirement Age</div>
                              <div className="text-sm font-medium text-muted-foreground">Monthly Payout</div>
                              <div className="text-sm font-medium text-muted-foreground">Total Capital</div>
                              <div className="w-9"></div>
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                      
                      <div className="space-y-2">
                        {statementsWithProjections[index]?.map((projection, projIndex) => (
                          <div key={`${index}-${projIndex}-${projectionCounter}`} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-2 pt-1 rounded-lg bg-muted">
                            <FormField
                              control={form.control}
                              name={`statements.${index}.retirement_projections.${projIndex}.retirement_age`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="50" 
                                      max="100" 
                                      {...field} 
                                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 67)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`statements.${index}.retirement_projections.${projIndex}.monthly_payout`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={projectionInputs[`${index}.${projIndex}.monthly_payout`] || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (isValidNumberFormat(value)) {
                                            setProjectionInputs(prev => ({
                                              ...prev,
                                              [`${index}.${projIndex}.monthly_payout`]: value
                                            }));
                                            
                                            const parsedValue = parseNumber(value, settings.number_locale);
                                            field.onChange(parsedValue);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const value = e.target.value;
                                          const parsedValue = parseNumber(value, settings.number_locale);
                                          const formattedValue = parsedValue.toString().replace('.', decimalSeparator);
                                          
                                          setProjectionInputs(prev => ({
                                            ...prev,
                                            [`${index}.${projIndex}.monthly_payout`]: formattedValue
                                          }));
                                          
                                          field.onChange(parsedValue);
                                        }}
                                        placeholder={`0${decimalSeparator}00`}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`statements.${index}.retirement_projections.${projIndex}.total_capital`}
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={projectionInputs[`${index}.${projIndex}.total_capital`] || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (isValidNumberFormat(value)) {
                                            setProjectionInputs(prev => ({
                                              ...prev,
                                              [`${index}.${projIndex}.total_capital`]: value
                                            }));
                                            
                                            const parsedValue = parseNumber(value, settings.number_locale);
                                            field.onChange(parsedValue);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const value = e.target.value;
                                          const parsedValue = parseNumber(value, settings.number_locale);
                                          const formattedValue = parsedValue.toString().replace('.', decimalSeparator);
                                          
                                          setProjectionInputs(prev => ({
                                            ...prev,
                                            [`${index}.${projIndex}.total_capital`]: formattedValue
                                          }));
                                          
                                          field.onChange(parsedValue);
                                        }}
                                        placeholder={`0${decimalSeparator}00`}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveProjection(index, projIndex)}
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
                          onClick={() => handleAddProjectionToStatement(index)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {(() => {
                            const projections = statementsWithProjections[index] || 
                              form.getValues()?.statements?.[index]?.retirement_projections || [];
                            
                            return projections.length === 0 ? (
                              <span>No retirement projections yet. Click to add your first projection.</span>
                            ) : (
                              <span>Add Projection</span>
                            );
                          })()}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <AlertDialog 
        open={statementToDelete !== null}
        onOpenChange={(open) => !open && setStatementToDelete(null)}
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

      <div className="space-y-8">
        {statementFields.length > 0 && (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed text-center py-6 text-sm text-muted-foreground border-2 rounded-lg"
            onClick={handleAddStatement}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Add a new statement</span>
          </Button>
        )}
        
        {/* Latest Statement Form */}
        {renderLatestStatementForm()}
        
        {/* Previous Statements List */}
        {renderPreviousStatements()}
        
        {statementFields.length === 0 && (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed text-center py-6 text-sm text-muted-foreground border-2 rounded-lg"
            onClick={handleAddStatement}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>No statements added yet. Click to add your first statement.</span>
          </Button>
        )}
      </div>
    </>
  )
} 