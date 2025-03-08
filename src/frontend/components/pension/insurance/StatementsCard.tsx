"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray, Path } from "react-hook-form"
import { InsurancePensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/frontend/components/ui/input"
import { useState, useEffect, useMemo } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator, getCurrencySymbol, formatNumberInput, safeNumberValue } from "@/frontend/lib/transforms"
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

type InputField = 'value' | 'total_contributions' | 'total_benefits' | 'costs_amount' | 'costs_percentage' | 'return_rate' | 'value_at_retirement' | 'monthly_payout'

export function StatementsCard({ form, pensionId }: StatementsCardProps) {
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control: form.control,
    name: "statements"
  })
  
  const { settings } = useSettings()
  const { deleteInsurancePensionStatement } = usePension()
  const { formatDate } = useDateFormat()
  
  // Split state into separate concerns
  const [statementValueInputs, setStatementValueInputs] = useState<string[]>([])
  const [contributionInputs, setContributionInputs] = useState<string[]>([])
  const [benefitsInputs, setBenefitsInputs] = useState<string[]>([])
  const [costsAmountInputs, setCostsAmountInputs] = useState<string[]>([])
  const [costsPercentageInputs, setCostsPercentageInputs] = useState<string[]>([])
  const [projectionInputs, setProjectionInputs] = useState<{[key: string]: string}>({})
  const [expandedStatements, setExpandedStatements] = useState<{[key: number]: boolean}>({})
  const [formattedDates, setFormattedDates] = useState<{[key: number]: string}>({})
  const [statementToDelete, setStatementToDelete] = useState<{ index: number, date: string } | null>(null)
  
  const decimalSeparator = getDecimalSeparator(settings.number_locale)
  const currencySymbol = getCurrencySymbol(settings.ui_locale, settings.currency)

  // Get the latest statement by sorting the statements array
  const sortedStatements = useMemo(() => {
    const statements = form.getValues("statements") || []
    return [...statements].sort((a, b) => {
      const dateA = new Date(a.statement_date).getTime()
      const dateB = new Date(b.statement_date).getTime()
      return dateB - dateA // Sort in descending order (latest first)
    })
  }, [form.getValues("statements")])

  const latestStatementIndex = useMemo(() => {
    if (!sortedStatements.length) return -1
    const latestDate = new Date(sortedStatements[0].statement_date).getTime()
    return statementFields.findIndex(
      field => new Date(field.statement_date).getTime() === latestDate
    )
  }, [sortedStatements, statementFields])

  // Initialize input states when form data changes
  useEffect(() => {
    const statements = form.getValues("statements")
    if (statements) {
      // Initialize main statement inputs with proper formatting
      setStatementValueInputs(
        statements.map(s => formatNumberInput(safeNumberValue(s.value) ?? 0, settings.number_locale))
      )
      setContributionInputs(
        statements.map(s => formatNumberInput(safeNumberValue(s.total_contributions) ?? 0, settings.number_locale))
      )
      setBenefitsInputs(
        statements.map(s => formatNumberInput(safeNumberValue(s.total_benefits) ?? 0, settings.number_locale))
      )
      setCostsAmountInputs(
        statements.map(s => formatNumberInput(safeNumberValue(s.costs_amount) ?? 0, settings.number_locale))
      )
      setCostsPercentageInputs(
        statements.map(s => formatNumberInput(safeNumberValue(s.costs_percentage) ?? 0, settings.number_locale))
      )

      // Initialize projection inputs with proper formatting
      const newProjectionInputs: {[key: string]: string} = {}
      statements.forEach((statement, statementIndex) => {
        statement.projections?.forEach((projection, projIndex) => {
          newProjectionInputs[`${statementIndex}.${projIndex}.return_rate`] = 
            formatNumberInput(safeNumberValue(projection.return_rate) ?? 0, settings.number_locale)
          newProjectionInputs[`${statementIndex}.${projIndex}.value_at_retirement`] = 
            formatNumberInput(safeNumberValue(projection.value_at_retirement) ?? 0, settings.number_locale)
          newProjectionInputs[`${statementIndex}.${projIndex}.monthly_payout`] = 
            formatNumberInput(safeNumberValue(projection.monthly_payout) ?? 0, settings.number_locale)
        })
      })
      setProjectionInputs(newProjectionInputs)

      // Initialize dates
      const newFormattedDates: {[key: number]: string} = {}
      statements.forEach((statement, index) => {
        if (statement.statement_date) {
          newFormattedDates[index] = formatDate(statement.statement_date)
        }
      })
      setFormattedDates(newFormattedDates)

      // Ensure all form values are properly set with numbers
      statements.forEach((statement, index) => {
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
    }
  }, [form, settings.number_locale, formatDate])

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
    
    // Initialize with empty strings
    setStatementValueInputs(prev => [...prev, ""])
    setContributionInputs(prev => [...prev, ""])
    setBenefitsInputs(prev => [...prev, ""])
    setCostsAmountInputs(prev => [...prev, ""])
    setCostsPercentageInputs(prev => [...prev, ""])
    
    const newStatementIndex = statementFields.length
    setFormattedDates(prev => ({
      ...prev,
      [newStatementIndex]: formatDate(statementDate)
    }))
  }

  const isValidNumberFormat = (value: string): boolean => {
    if (!value) return true
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
  }

  // Updated input handlers for each type of input
  const handleStatementValueInput = (index: number, value: string) => {
    if (isValidNumberFormat(value)) {
      const newInputs = [...statementValueInputs]
      newInputs[index] = value
      setStatementValueInputs(newInputs)
      
      const parsedValue = parseNumber(value, settings.number_locale)
      if (parsedValue >= 0) {
        form.setValue(`statements.${index}.value` as Path<InsurancePensionFormData>, parsedValue)
      }
    }
  }

  const handleContributionInput = (index: number, value: string) => {
    if (isValidNumberFormat(value)) {
      const newInputs = [...contributionInputs]
      newInputs[index] = value
      setContributionInputs(newInputs)
      
      const parsedValue = parseNumber(value, settings.number_locale)
      if (parsedValue >= 0) {
        form.setValue(`statements.${index}.total_contributions` as Path<InsurancePensionFormData>, parsedValue)
      }
    }
  }

  const handleBenefitsInput = (index: number, value: string) => {
    if (isValidNumberFormat(value)) {
      const newInputs = [...benefitsInputs]
      newInputs[index] = value
      setBenefitsInputs(newInputs)
      
      const parsedValue = parseNumber(value, settings.number_locale)
      if (parsedValue >= 0) {
        form.setValue(`statements.${index}.total_benefits` as Path<InsurancePensionFormData>, parsedValue)
      }
    }
  }

  const handleCostsAmountInput = (index: number, value: string) => {
    if (isValidNumberFormat(value)) {
      const newInputs = [...costsAmountInputs]
      newInputs[index] = value
      setCostsAmountInputs(newInputs)
      
      const parsedValue = parseNumber(value, settings.number_locale)
      if (parsedValue > 0) {
        form.setValue(`statements.${index}.costs_amount` as Path<InsurancePensionFormData>, parsedValue)
      }
    }
  }

  const handleCostsPercentageInput = (index: number, value: string) => {
    if (isValidNumberFormat(value)) {
      const newInputs = [...costsPercentageInputs]
      newInputs[index] = value
      setCostsPercentageInputs(newInputs)
      
      const parsedValue = parseNumber(value, settings.number_locale)
      if (parsedValue >= 0 && parsedValue <= 100) {
        form.setValue(`statements.${index}.costs_percentage` as Path<InsurancePensionFormData>, parsedValue)
      }
    }
  }

  const handleProjectionInput = (statementIndex: number, projectionIndex: number, field: InputField, value: string) => {
    if (isValidNumberFormat(value)) {
      setProjectionInputs(prev => ({
        ...prev,
        [`${statementIndex}.${projectionIndex}.${field}`]: value
      }))
      
      const parsedValue = parseNumber(value, settings.number_locale)
      if (parsedValue >= 0) {
        const path = `statements.${statementIndex}.projections.${projectionIndex}.${field}` as FormPath
        form.setValue(path as Path<InsurancePensionFormData>, parsedValue)
      }
    }
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

    form.setValue(`statements.${statementIndex}.projections` as Path<InsurancePensionFormData>, [...currentProjections, newProjection])

    const projectionIndex = currentProjections.length
    // Initialize projection inputs with empty strings
    setProjectionInputs(prev => ({
      ...prev,
      [`${statementIndex}.${projectionIndex}.return_rate`]: "",
      [`${statementIndex}.${projectionIndex}.value_at_retirement`]: "",
      [`${statementIndex}.${projectionIndex}.monthly_payout`]: ""
    }))
  }

  const handleRemoveProjection = (statementIndex: number, projectionIndex: number) => {
    const statements = form.getValues("statements")
    if (!statements?.[statementIndex]?.projections) return

    const currentProjections = [...statements[statementIndex].projections]
    currentProjections.splice(projectionIndex, 1)

    form.setValue(`statements.${statementIndex}.projections` as Path<InsurancePensionFormData>, currentProjections)

    // Clean up inputs
    const newInputs = { ...projectionInputs }
    delete newInputs[`${statementIndex}.${projectionIndex}.return_rate`]
    delete newInputs[`${statementIndex}.${projectionIndex}.value_at_retirement`]
    delete newInputs[`${statementIndex}.${projectionIndex}.monthly_payout`]
    setProjectionInputs(newInputs)
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

    // Update all state using the current form data to ensure consistency
    const updatedFormData = form.getValues()
    const updatedStatements = updatedFormData.statements || []
    
    // Reset all state based on current form data
    setStatementValueInputs(
      updatedStatements.map(s => formatNumberInput(safeNumberValue(s.value) ?? 0, settings.number_locale))
    )
    setContributionInputs(
      updatedStatements.map(s => formatNumberInput(safeNumberValue(s.total_contributions) ?? 0, settings.number_locale))
    )
    setBenefitsInputs(
      updatedStatements.map(s => formatNumberInput(safeNumberValue(s.total_benefits) ?? 0, settings.number_locale))
    )
    setCostsAmountInputs(
      updatedStatements.map(s => formatNumberInput(safeNumberValue(s.costs_amount) ?? 0, settings.number_locale))
    )
    setCostsPercentageInputs(
      updatedStatements.map(s => formatNumberInput(safeNumberValue(s.costs_percentage) ?? 0, settings.number_locale))
    )
  }

  const confirmDeleteStatement = (index: number) => {
    const date = formattedDates[index] || 'unknown date'
    setStatementToDelete({ index, date })
  }

  const renderInput = (index: number, field: InputField, value: string, onChange: (value: string) => void) => (
    <FormControl>
      <Input
        type="text"
        inputMode="decimal"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const parsedValue = parseNumber(value || "", settings.number_locale)
          if (parsedValue >= 0) {
            const formattedValue = formatNumberInput(parsedValue, settings.number_locale)
            switch (field) {
              case 'value':
                setStatementValueInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.value` as Path<InsurancePensionFormData>, parsedValue)
                break
              case 'total_contributions':
                setContributionInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.total_contributions` as Path<InsurancePensionFormData>, parsedValue)
                break
              case 'total_benefits':
                setBenefitsInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.total_benefits` as Path<InsurancePensionFormData>, parsedValue)
                break
              case 'costs_amount':
                setCostsAmountInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.costs_amount` as Path<InsurancePensionFormData>, parsedValue)
                break
              case 'costs_percentage':
                setCostsPercentageInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.costs_percentage` as Path<InsurancePensionFormData>, parsedValue)
                break
              default:
                // For projection fields
                setProjectionInputs(prev => ({
                  ...prev,
                  [`${index}.${field}`]: formattedValue
                }))
                const [statementIndex, projectionIndex] = field.split('.')
                if (statementIndex && projectionIndex) {
                  form.setValue(`statements.${statementIndex}.projections.${projectionIndex}.${field}` as Path<InsurancePensionFormData>, parsedValue)
                }
            }
          } else {
            // Reset to 0 if invalid and update form
            const formattedValue = formatNumberInput(0, settings.number_locale)
            switch (field) {
              case 'value':
                setStatementValueInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.value` as Path<InsurancePensionFormData>, 0)
                break
              case 'total_contributions':
                setContributionInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.total_contributions` as Path<InsurancePensionFormData>, 0)
                break
              case 'total_benefits':
                setBenefitsInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.total_benefits` as Path<InsurancePensionFormData>, 0)
                break
              case 'costs_amount':
                setCostsAmountInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.costs_amount` as Path<InsurancePensionFormData>, 0)
                break
              case 'costs_percentage':
                setCostsPercentageInputs(prev => {
                  const newInputs = [...prev]
                  newInputs[index] = formattedValue
                  return newInputs
                })
                form.setValue(`statements.${index}.costs_percentage` as Path<InsurancePensionFormData>, 0)
                break
              default:
                // For projection fields
                setProjectionInputs(prev => ({
                  ...prev,
                  [`${index}.${field}`]: formattedValue
                }))
                const [statementIndex, projectionIndex] = field.split('.')
                if (statementIndex && projectionIndex) {
                  form.setValue(`statements.${statementIndex}.projections.${projectionIndex}.${field}` as Path<InsurancePensionFormData>, 0)
                }
            }
          }
        }}
        placeholder={`0${decimalSeparator}00`}
      />
    </FormControl>
  )

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
          render={() => (
            <FormItem>
              <FormLabel>Value ({currencySymbol})</FormLabel>
              <FormControl>
                {renderInput(
                  index,
                  'value',
                  statementValueInputs[index] || "",
                  (value) => handleStatementValueInput(index, value)
                )}
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
                {renderInput(
                  index,
                  'total_contributions',
                  contributionInputs[index] || "",
                  (value) => handleContributionInput(index, value)
                )}
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
                {renderInput(
                  index,
                  'total_benefits',
                  benefitsInputs[index] || "",
                  (value) => handleBenefitsInput(index, value)
                )}
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
                {renderInput(
                  index,
                  'costs_amount',
                  costsAmountInputs[index] || "",
                  (value) => handleCostsAmountInput(index, value)
                )}
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
                {renderInput(
                  index,
                  'costs_percentage',
                  costsPercentageInputs[index] || "",
                  (value) => handleCostsPercentageInput(index, value)
                )}
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
                      value={field.value?.toString() || 'with_contributions'}
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
                      {renderInput(
                        index,
                        'return_rate',
                        projectionInputs[`${index}.${projectionIndex}.return_rate`] || "",
                        (value) => handleProjectionInput(index, projectionIndex, 'return_rate', value)
                      )}
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
                      {renderInput(
                        index,
                        'value_at_retirement',
                        projectionInputs[`${index}.${projectionIndex}.value_at_retirement`] || "",
                        (value) => handleProjectionInput(index, projectionIndex, 'value_at_retirement', value)
                      )}
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
                      {renderInput(
                        index,
                        'monthly_payout',
                        projectionInputs[`${index}.${projectionIndex}.monthly_payout`] || "",
                        (value) => handleProjectionInput(index, projectionIndex, 'monthly_payout', value)
                      )}
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
    </div>
  )

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

      {/* Latest Statement */}
      {latestStatementIndex >= 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Latest Statement</h3>
          <div className="p-4 border rounded-md">
            {renderStatementForm(latestStatementIndex)}
          </div>
        </div>
      )}

      {/* Previous Statements */}
      {statementFields.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Previous Statements</h3>
          {statementFields
            .map((field, index) => ({ field, index }))
            .filter(({ index }) => index !== latestStatementIndex)
            .sort((a, b) => {
              const dateA = new Date(form.getValues(`statements.${a.index}.statement_date`)).getTime()
              const dateB = new Date(form.getValues(`statements.${b.index}.statement_date`)).getTime()
              return dateB - dateA // Sort in descending order
            })
            .map(({ field, index }) => (
              <Collapsible
                key={field.id}
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
                        Statement from {formattedDates[index]}
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
                <CollapsibleContent className="p-4">
                  {renderStatementForm(index)}
                </CollapsibleContent>
              </Collapsible>
            ))}
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
    </div>
  )
} 