"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { CompanyPensionFormData, RetirementProjection } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/frontend/components/ui/input"
import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator, getCurrencySymbol } from "@/frontend/lib/transforms"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card"

interface PensionStatementsCardProps {
  form: UseFormReturn<CompanyPensionFormData>
}

/**
 * Card component for managing pension statements and retirement projections.
 * Handles adding, editing, and removing statements and their associated projections.
 */
export function PensionStatementsCard({ form }: PensionStatementsCardProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control: form.control,
    name: "statements"
  })
  
  const { settings } = useSettings()
  const [statementValueInputs, setStatementValueInputs] = useState<string[]>([])
  const [projectionInputs, setProjectionInputs] = useState<{[key: string]: string}>({})
  const [statementsWithProjections, setStatementsWithProjections] = useState<{[key: number]: RetirementProjection[]}>({})
  const [projectionCounter, setProjectionCounter] = useState(0)
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
    
    const newStatementIndex = form.getValues("statements")?.length || 0;
    setStatementsWithProjections(prev => ({
      ...prev,
      [newStatementIndex - 1]: []
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1.5">
          <CardTitle>Pension Statements</CardTitle>
          <CardDescription>
            Track your pension statements and retirement projections
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddStatement}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Statement
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {statementFields.map((statementField, statementIndex) => (
            <div key={statementField.id} className="space-y-4 p-4 border rounded-md">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Statement {statementIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStatement(statementIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`statements.${statementIndex}.statement_date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statement Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const date = new Date(e.target.value)
                            date.setUTCHours(0, 0, 0, 0)
                            field.onChange(date)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`statements.${statementIndex}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value ({currencySymbol})</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={statementValueInputs[statementIndex] || ""}
                            onChange={(e) => {
                              const newValue = e.target.value
                              if (isValidNumberFormat(newValue)) {
                                const newInputs = [...statementValueInputs]
                                newInputs[statementIndex] = newValue
                                setStatementValueInputs(newInputs)
                                
                                const parsedValue = parseNumber(newValue, settings.number_locale)
                                if (parsedValue >= 0) {
                                  field.onChange(parsedValue)
                                }
                              }
                            }}
                            onBlur={() => {
                              const value = parseNumber(statementValueInputs[statementIndex] || "", settings.number_locale)
                              if (value >= 0) {
                                const newInputs = [...statementValueInputs]
                                newInputs[statementIndex] = value.toString().replace('.', decimalSeparator)
                                setStatementValueInputs(newInputs)
                                field.onChange(value)
                              } else {
                                const newInputs = [...statementValueInputs]
                                newInputs[statementIndex] = ""
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
                  name={`statements.${statementIndex}.note`}
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddProjectionToStatement(statementIndex)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Projection
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    const projections = statementsWithProjections[statementIndex] || 
                      form.getValues()?.statements?.[statementIndex]?.retirement_projections || [];
                    
                    return Array.isArray(projections) ? projections.map((projection, projectionIndex) => (
                      <div key={`${statementIndex}-${projectionIndex}-${projectionCounter}`} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
                        <FormField
                          control={form.control}
                          name={`statements.${statementIndex}.retirement_projections.${projectionIndex}.retirement_age`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Retirement Age</FormLabel>
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
                          name={`statements.${statementIndex}.retirement_projections.${projectionIndex}.monthly_payout`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Payout ({currencySymbol})</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={projectionInputs[`${statementIndex}.${projectionIndex}.monthly_payout`] || ""}
                                    onChange={(e) => {
                                      const newValue = e.target.value
                                      if (isValidNumberFormat(newValue)) {
                                        setProjectionInputs({
                                          ...projectionInputs,
                                          [`${statementIndex}.${projectionIndex}.monthly_payout`]: newValue
                                        })
                                        
                                        const parsedValue = parseNumber(newValue, settings.number_locale)
                                        if (parsedValue >= 0) {
                                          field.onChange(parsedValue)
                                        }
                                      }
                                    }}
                                    onBlur={() => {
                                      const value = parseNumber(projectionInputs[`${statementIndex}.${projectionIndex}.monthly_payout`] || "", settings.number_locale)
                                      if (value >= 0) {
                                        setProjectionInputs({
                                          ...projectionInputs,
                                          [`${statementIndex}.${projectionIndex}.monthly_payout`]: value.toString().replace('.', decimalSeparator)
                                        })
                                        field.onChange(value)
                                      } else {
                                        setProjectionInputs({
                                          ...projectionInputs,
                                          [`${statementIndex}.${projectionIndex}.monthly_payout`]: ""
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
                          name={`statements.${statementIndex}.retirement_projections.${projectionIndex}.total_capital`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Capital ({currencySymbol})</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={projectionInputs[`${statementIndex}.${projectionIndex}.total_capital`] || ""}
                                    onChange={(e) => {
                                      const newValue = e.target.value
                                      if (isValidNumberFormat(newValue)) {
                                        setProjectionInputs({
                                          ...projectionInputs,
                                          [`${statementIndex}.${projectionIndex}.total_capital`]: newValue
                                        })
                                        
                                        const parsedValue = parseNumber(newValue, settings.number_locale)
                                        if (parsedValue >= 0) {
                                          field.onChange(parsedValue)
                                        }
                                      }
                                    }}
                                    onBlur={() => {
                                      const value = parseNumber(projectionInputs[`${statementIndex}.${projectionIndex}.total_capital`] || "", settings.number_locale)
                                      if (value >= 0) {
                                        setProjectionInputs({
                                          ...projectionInputs,
                                          [`${statementIndex}.${projectionIndex}.total_capital`]: value.toString().replace('.', decimalSeparator)
                                        })
                                        field.onChange(value)
                                      } else {
                                        setProjectionInputs({
                                          ...projectionInputs,
                                          [`${statementIndex}.${projectionIndex}.total_capital`]: ""
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
                          onClick={() => handleRemoveProjection(statementIndex, projectionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )) : null;
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 