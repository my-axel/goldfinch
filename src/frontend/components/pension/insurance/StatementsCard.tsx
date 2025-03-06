"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/frontend/components/ui/input"
import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator, formatCurrency, formatPercent, getCurrencySymbol } from "@/frontend/lib/transforms"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select"

interface StatementsCardProps {
  form: UseFormReturn<InsurancePensionFormData>
  pensionId?: number
}

type FormPath = `statements.${number}.value` 
  | `statements.${number}.total_contributions`
  | `statements.${number}.total_benefits`
  | `statements.${number}.costs_amount`
  | `statements.${number}.costs_percentage`
  | `statements.${number}.projections.${number}.return_rate`
  | `statements.${number}.projections.${number}.value_at_retirement`
  | `statements.${number}.projections.${number}.monthly_payout`
  | `statements.${number}.projections.${number}.scenario_type`

export function StatementsCard({ form, pensionId }: StatementsCardProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control: form.control,
    name: "statements"
  })
  
  const { settings } = useSettings()
  const { deleteInsurancePensionStatement } = usePension()
  const { formatDate } = useDateFormat()
  
  // State for form inputs
  const [statementInputs, setStatementInputs] = useState<{[key: string]: string}>({})
  const [expandedStatements, setExpandedStatements] = useState<{[key: number]: boolean}>({})
  const [formattedDates, setFormattedDates] = useState<{[key: number]: string}>({})
  const [statementToDelete, setStatementToDelete] = useState<{ index: number, date: string } | null>(null)
  
  const decimalSeparator = getDecimalSeparator(settings.number_locale)
  const currencySymbol = getCurrencySymbol(settings.ui_locale, settings.currency)

  // Initialize input states when form data changes
  useEffect(() => {
    const statements = form.getValues("statements")
    if (statements) {
      const newStatementInputs: {[key: string]: string} = {}
      const newFormattedDates: {[key: number]: string} = {}

      statements.forEach((statement, index) => {
        // Initialize all numeric inputs
        newStatementInputs[`${index}.value`] = statement.value?.toString().replace('.', decimalSeparator) || ""
        newStatementInputs[`${index}.total_contributions`] = statement.total_contributions?.toString().replace('.', decimalSeparator) || ""
        newStatementInputs[`${index}.total_benefits`] = statement.total_benefits?.toString().replace('.', decimalSeparator) || ""
        newStatementInputs[`${index}.costs_amount`] = statement.costs_amount?.toString().replace('.', decimalSeparator) || ""
        newStatementInputs[`${index}.costs_percentage`] = statement.costs_percentage?.toString().replace('.', decimalSeparator) || ""
        
        // Format dates
        if (statement.statement_date) {
          newFormattedDates[index] = formatDate(statement.statement_date)
        }

        // Initialize projections
        statement.projections?.forEach((projection, projIndex) => {
          newStatementInputs[`${index}.projections.${projIndex}.return_rate`] = 
            projection.return_rate?.toString().replace('.', decimalSeparator) || ""
          newStatementInputs[`${index}.projections.${projIndex}.value_at_retirement`] = 
            projection.value_at_retirement?.toString().replace('.', decimalSeparator) || ""
          newStatementInputs[`${index}.projections.${projIndex}.monthly_payout`] = 
            projection.monthly_payout?.toString().replace('.', decimalSeparator) || ""
        })
      })

      setStatementInputs(newStatementInputs)
      setFormattedDates(newFormattedDates)
    }
  }, [form, decimalSeparator, formatDate])

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
      projections: []
    })
    
    const newStatementIndex = statementFields.length
    setFormattedDates(prev => ({
      ...prev,
      [newStatementIndex]: formatDate(statementDate)
    }))

    // Initialize inputs for the new statement
    setStatementInputs(prev => ({
      ...prev,
      [`${newStatementIndex}.value`]: "0",
      [`${newStatementIndex}.total_contributions`]: "0",
      [`${newStatementIndex}.total_benefits`]: "0",
      [`${newStatementIndex}.costs_amount`]: "0",
      [`${newStatementIndex}.costs_percentage`]: "0"
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

    form.setValue(`statements.${statementIndex}.projections`, [...currentProjections, newProjection])

    const projectionIndex = currentProjections.length
    setStatementInputs(prev => ({
      ...prev,
      [`${statementIndex}.projections.${projectionIndex}.return_rate`]: "0",
      [`${statementIndex}.projections.${projectionIndex}.value_at_retirement`]: "0",
      [`${statementIndex}.projections.${projectionIndex}.monthly_payout`]: "0"
    }))
  }

  const handleRemoveProjection = (statementIndex: number, projectionIndex: number) => {
    const statements = form.getValues("statements")
    if (!statements?.[statementIndex]?.projections) return

    const currentProjections = [...statements[statementIndex].projections]
    currentProjections.splice(projectionIndex, 1)

    form.setValue(`statements.${statementIndex}.projections`, currentProjections)

    // Clean up inputs
    const newInputs = { ...statementInputs }
    delete newInputs[`${statementIndex}.projections.${projectionIndex}.return_rate`]
    delete newInputs[`${statementIndex}.projections.${projectionIndex}.value_at_retirement`]
    delete newInputs[`${statementIndex}.projections.${projectionIndex}.monthly_payout`]
    setStatementInputs(newInputs)
  }

  const handleNumberInput = (value: string, path: FormPath) => {
    const newValue = value.trim()
    setStatementInputs(prev => ({
      ...prev,
      [path]: newValue
    }))

    if (newValue === "") {
      form.setValue(path, 0)
      return
    }

    const parsedValue = parseNumber(newValue, settings.number_locale)
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      form.setValue(path, parsedValue)
    }
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
    setStatementToDelete(null)
  }

  const confirmDeleteStatement = (index: number) => {
    const date = formattedDates[index] || 'unknown date'
    setStatementToDelete({ index, date })
  }

  const renderStatementForm = (index: number, isLatest: boolean = false) => (
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
          render={() => (
            <FormItem>
              <FormLabel>Value ({currencySymbol})</FormLabel>
              <FormControl>
                <Input
                  value={statementInputs[`${index}.value`] || ""}
                  onChange={(e) => handleNumberInput(e.target.value, `statements.${index}.value`)}
                  onBlur={() => {
                    const value = parseNumber(statementInputs[`${index}.value`] || "", settings.number_locale)
                    if (!isNaN(value)) {
                      setStatementInputs(prev => ({
                        ...prev,
                        [`${index}.value`]: formatCurrency(value, {
                          locale: settings.number_locale,
                          currency: settings.currency
                        }).formatted.replace(settings.currency, '').trim()
                      }))
                    }
                  }}
                  placeholder={`0${decimalSeparator}00`}
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
          render={() => (
            <FormItem>
              <FormLabel>Total Contributions ({currencySymbol})</FormLabel>
              <FormControl>
                <Input
                  value={statementInputs[`${index}.total_contributions`] || ""}
                  onChange={(e) => handleNumberInput(e.target.value, `statements.${index}.total_contributions`)}
                  onBlur={() => {
                    const value = parseNumber(statementInputs[`${index}.total_contributions`] || "", settings.number_locale)
                    if (!isNaN(value)) {
                      setStatementInputs(prev => ({
                        ...prev,
                        [`${index}.total_contributions`]: formatCurrency(value, {
                          locale: settings.number_locale,
                          currency: settings.currency
                        }).formatted.replace(settings.currency, '').trim()
                      }))
                    }
                  }}
                  placeholder={`0${decimalSeparator}00`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`statements.${index}.total_benefits`}
          render={() => (
            <FormItem>
              <FormLabel>Total Benefits ({currencySymbol})</FormLabel>
              <FormControl>
                <Input
                  value={statementInputs[`${index}.total_benefits`] || ""}
                  onChange={(e) => handleNumberInput(e.target.value, `statements.${index}.total_benefits`)}
                  onBlur={() => {
                    const value = parseNumber(statementInputs[`${index}.total_benefits`] || "", settings.number_locale)
                    if (!isNaN(value)) {
                      setStatementInputs(prev => ({
                        ...prev,
                        [`${index}.total_benefits`]: formatCurrency(value, {
                          locale: settings.number_locale,
                          currency: settings.currency
                        }).formatted.replace(settings.currency, '').trim()
                      }))
                    }
                  }}
                  placeholder={`0${decimalSeparator}00`}
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
          render={() => (
            <FormItem>
              <FormLabel>Costs Amount ({currencySymbol})</FormLabel>
              <FormControl>
                <Input
                  value={statementInputs[`${index}.costs_amount`] || ""}
                  onChange={(e) => handleNumberInput(e.target.value, `statements.${index}.costs_amount`)}
                  onBlur={() => {
                    const value = parseNumber(statementInputs[`${index}.costs_amount`] || "", settings.number_locale)
                    if (!isNaN(value)) {
                      setStatementInputs(prev => ({
                        ...prev,
                        [`${index}.costs_amount`]: formatCurrency(value, {
                          locale: settings.number_locale,
                          currency: settings.currency
                        }).formatted.replace(settings.currency, '').trim()
                      }))
                    }
                  }}
                  placeholder={`0${decimalSeparator}00`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`statements.${index}.costs_percentage`}
          render={() => (
            <FormItem>
              <FormLabel>Costs Percentage (%)</FormLabel>
              <FormControl>
                <Input
                  value={statementInputs[`${index}.costs_percentage`] || ""}
                  onChange={(e) => handleNumberInput(e.target.value, `statements.${index}.costs_percentage`)}
                  onBlur={() => {
                    const value = parseNumber(statementInputs[`${index}.costs_percentage`] || "", settings.number_locale)
                    if (!isNaN(value)) {
                      setStatementInputs(prev => ({
                        ...prev,
                        [`${index}.costs_percentage`]: formatPercent(value / 100, {
                          locale: settings.number_locale,
                          decimals: 2
                        }).formatted.replace('%', '')
                      }))
                    }
                  }}
                  placeholder={`0${decimalSeparator}00`}
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
              <Input {...field} placeholder="Additional information about this statement" />
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
          {form.getValues(`statements.${index}.projections`)?.length > 0 && (
            <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1.5fr_auto] gap-4 px-4">
              <div className="text-sm font-medium text-muted-foreground">Scenario Type</div>
              <div className="text-sm font-medium text-muted-foreground">Return Rate (%)</div>
              <div className="text-sm font-medium text-muted-foreground">Value at Retirement ({currencySymbol})</div>
              <div className="text-sm font-medium text-muted-foreground">Monthly Payout ({currencySymbol})</div>
              <div className="w-9"></div>
            </div>
          )}

          {form.getValues(`statements.${index}.projections`)?.map((projection, projectionIndex) => (
            <div key={projectionIndex} className="grid grid-cols-[1.5fr_1fr_1.5fr_1.5fr_auto] gap-4 items-end p-4 rounded-lg bg-muted">
              <FormField
                control={form.control}
                name={`statements.${index}.projections.${projectionIndex}.scenario_type` as FormPath}
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(value as 'with_contributions' | 'without_contributions')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scenario type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="with_contributions">With Contributions</SelectItem>
                        <SelectItem value="without_contributions">Without Contributions</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`statements.${index}.projections.${projectionIndex}.return_rate`}
                render={() => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        value={statementInputs[`${index}.projections.${projectionIndex}.return_rate`] || ""}
                        onChange={(e) => handleNumberInput(
                          e.target.value,
                          `statements.${index}.projections.${projectionIndex}.return_rate`
                        )}
                        onBlur={() => {
                          const value = parseNumber(
                            statementInputs[`${index}.projections.${projectionIndex}.return_rate`] || "",
                            settings.number_locale
                          )
                          if (!isNaN(value)) {
                            setStatementInputs(prev => ({
                              ...prev,
                              [`${index}.projections.${projectionIndex}.return_rate`]: formatPercent(value / 100, {
                                locale: settings.number_locale,
                                decimals: 2
                              }).formatted.replace('%', '')
                            }))
                          }
                        }}
                        placeholder={`0${decimalSeparator}00`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`statements.${index}.projections.${projectionIndex}.value_at_retirement`}
                render={() => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        value={statementInputs[`${index}.projections.${projectionIndex}.value_at_retirement`] || ""}
                        onChange={(e) => handleNumberInput(
                          e.target.value,
                          `statements.${index}.projections.${projectionIndex}.value_at_retirement`
                        )}
                        onBlur={() => {
                          const value = parseNumber(
                            statementInputs[`${index}.projections.${projectionIndex}.value_at_retirement`] || "",
                            settings.number_locale
                          )
                          if (!isNaN(value)) {
                            setStatementInputs(prev => ({
                              ...prev,
                              [`${index}.projections.${projectionIndex}.value_at_retirement`]: formatCurrency(value, {
                                locale: settings.number_locale,
                                currency: settings.currency
                              }).formatted.replace(settings.currency, '').trim()
                            }))
                          }
                        }}
                        placeholder={`0${decimalSeparator}00`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`statements.${index}.projections.${projectionIndex}.monthly_payout`}
                render={() => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        value={statementInputs[`${index}.projections.${projectionIndex}.monthly_payout`] || ""}
                        onChange={(e) => handleNumberInput(
                          e.target.value,
                          `statements.${index}.projections.${projectionIndex}.monthly_payout`
                        )}
                        onBlur={() => {
                          const value = parseNumber(
                            statementInputs[`${index}.projections.${projectionIndex}.monthly_payout`] || "",
                            settings.number_locale
                          )
                          if (!isNaN(value)) {
                            setStatementInputs(prev => ({
                              ...prev,
                              [`${index}.projections.${projectionIndex}.monthly_payout`]: formatCurrency(value, {
                                locale: settings.number_locale,
                                currency: settings.currency
                              }).formatted.replace(settings.currency, '').trim()
                            }))
                          }
                        }}
                        placeholder={`0${decimalSeparator}00`}
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
            {form.getValues(`statements.${index}.projections`)?.length === 0
              ? "No projections yet. Click to add your first projection."
              : "Add Projection"}
          </Button>
        </div>
      </div>

      {!isLatest && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => confirmDeleteStatement(index)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Statement
        </Button>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statements</CardTitle>
        <CardDescription>
          Track your insurance policy statements and projections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Latest Statement */}
        {statementFields.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Latest Statement</h3>
            <div className="p-4 border rounded-md">
              {renderStatementForm(0, true)}
            </div>
          </div>
        )}

        {/* Previous Statements */}
        {statementFields.length > 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Previous Statements</h3>
            {statementFields.slice(1).map((field, index) => {
              // Add 1 to index since we're starting from the second statement
              const statementIndex = index + 1
              return (
                <Collapsible
                  key={field.id}
                  open={expandedStatements[statementIndex]}
                  onOpenChange={() => toggleStatement(statementIndex)}
                  className="border rounded-md overflow-hidden"
                >
                  <div className="p-4 flex justify-between items-center bg-muted/30">
                    <CollapsibleTrigger asChild>
                      <Button 
                        type="button"
                        variant="ghost" 
                        className="p-0 h-auto flex items-center gap-2 hover:bg-transparent"
                      >
                        {expandedStatements[statementIndex] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <h4 className="font-medium">
                          Statement from {formattedDates[statementIndex]}
                        </h4>
                      </Button>
                    </CollapsibleTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDeleteStatement(statementIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CollapsibleContent className="p-4">
                    {renderStatementForm(statementIndex)}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        )}

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
      </CardContent>
    </Card>
  )
} 