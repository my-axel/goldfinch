"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { CompanyPensionFormData, RetirementProjection } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDownIcon } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Input } from "@/frontend/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { useState, useEffect } from "react"
import { useHousehold } from "@/frontend/context/HouseholdContext"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator, getCurrencySymbol } from "@/frontend/lib/transforms"

interface CompanyPensionFormProps {
  form: UseFormReturn<CompanyPensionFormData>
}

/**
 * Form component for company-specific pension fields.
 * Handles employer details and contribution plan management.
 */
export function AddCompanyPensionForm({ form }: CompanyPensionFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan_steps"
  })
  
  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control: form.control,
    name: "statements"
  })
  
  // We can't use useFieldArray in a loop, so we'll manage projections manually
  const [open, setOpen] = useState<number | null>(null)
  const { members } = useHousehold()
  const { settings } = useSettings()
  const [contributionAmountInput, setContributionAmountInput] = useState("")
  const [contributionInputs, setContributionInputs] = useState<string[]>([])
  const [statementValueInputs, setStatementValueInputs] = useState<string[]>([])
  const [projectionInputs, setProjectionInputs] = useState<{[key: string]: string}>({})
  const [currencyDisplay, setCurrencyDisplay] = useState("")
  const [placeholder, setPlaceholder] = useState("0.00")
  const [decimalSeparator, setDecimalSeparator] = useState(".")
  // Add a counter to force re-renders when projections change
  const [projectionCounter, setProjectionCounter] = useState(0)
  
  useEffect(() => {
    setCurrencyDisplay(getCurrencySymbol(settings.number_locale, settings.currency))
    setDecimalSeparator(getDecimalSeparator(settings.number_locale))
  }, [settings.number_locale, settings.currency])

  useEffect(() => {
    setPlaceholder(`0${decimalSeparator}00`)
  }, [decimalSeparator])
  
  // Add a state to directly track projections for each statement
  const [statementsWithProjections, setStatementsWithProjections] = useState<{[key: number]: RetirementProjection[]}>({});

  // Initialize input states when form data changes
  useEffect(() => {
    const contributionSteps = form.getValues("contribution_plan_steps");
    const statements = form.getValues("statements");
    
    // Initialize contribution inputs
    if (contributionSteps && contributionSteps.length > 0) {
      const newContributionInputs = contributionSteps.map(step => 
        step.amount ? step.amount.toString().replace('.', decimalSeparator) : ""
      );
      setContributionInputs(newContributionInputs);
    }
    
    // Initialize statement value inputs
    if (statements && statements.length > 0) {
      const newStatementValueInputs = statements.map(statement => 
        statement.value ? statement.value.toString().replace('.', decimalSeparator) : ""
      );
      setStatementValueInputs(newStatementValueInputs);
      
      // Initialize projection inputs for each statement
      const newProjectionInputs: {[key: string]: string} = {};
      const newStatementsWithProjections: {[key: number]: RetirementProjection[]} = {};
      
      statements.forEach((statement, statementIndex) => {
        // Ensure retirement_projections is initialized as an array
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
    
    // Initialize contribution amount input
    const contributionAmount = form.getValues("contribution_amount");
    if (contributionAmount !== undefined) {
      setContributionAmountInput(contributionAmount.toString().replace('.', decimalSeparator));
    }
  }, [form, decimalSeparator]);

  // Validate if the input is a valid number format
  const isValidNumberFormat = (value: string): boolean => {
    // Allow empty input
    if (!value) return true
    
    // Allow only digits, one decimal separator, and one minus sign at the start
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
  }

  const handleAddContribution = () => {
    let startDate = new Date()
    startDate.setUTCHours(0, 0, 0, 0)  // Ensure UTC midnight

    // If there are existing contributions, check the last one's end date
    if (fields.length > 0) {
      const lastEndDate = form.getValues(`contribution_plan_steps.${fields.length - 1}.end_date`)
      
      if (lastEndDate) {
        // Use the day after the last end date as the start date
        startDate = new Date(lastEndDate)
        startDate.setUTCHours(0, 0, 0, 0)  // Ensure UTC midnight
        startDate.setDate(startDate.getDate() + 1)
      }
    }

    append({
      amount: 0,
      frequency: ContributionFrequency.MONTHLY,
      start_date: startDate,
      end_date: undefined
    })
    
    // Add a new entry to the contributionInputs array
    setContributionInputs([...contributionInputs, ""])
  }
  
  const handleAddStatement = () => {
    const statementDate = new Date();
    // Ensure we're setting a proper Date object with time set to midnight UTC
    statementDate.setUTCHours(0, 0, 0, 0);
    
    appendStatement({
      statement_date: statementDate,
      value: 0,
      note: "",
      retirement_projections: [] // Explicitly initialize as empty array
    })
    
    // Add a new entry to the statementValueInputs array
    setStatementValueInputs([...statementValueInputs, "0"])
    
    // Initialize the statementsWithProjections for the new statement
    const newStatementIndex = form.getValues("statements")?.length || 0;
    setStatementsWithProjections(prev => ({
      ...prev,
      [newStatementIndex - 1]: []
    }));
  }
  
  const handleAddProjectionToStatement = (statementIndex: number) => {
    // Get the current form values
    const formValues = form.getValues() as CompanyPensionFormData;
    
    // Ensure statements array exists
    if (!formValues.statements || !formValues.statements[statementIndex]) {
      return;
    }
    
    // Get current retirement projections or initialize as empty array
    const currentProjections = Array.isArray(formValues.statements[statementIndex].retirement_projections) 
      ? [...formValues.statements[statementIndex].retirement_projections] 
      : [];
    
    // Create new projection
    const newProjection = {
      retirement_age: 67,
      monthly_payout: 0,
      total_capital: 0
    };
    
    // Add the new projection to the array
    const updatedProjections = [...currentProjections, newProjection];
    
    // Update just the retirement_projections field
    form.setValue(`statements.${statementIndex}.retirement_projections`, updatedProjections, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    // Get the new projection index
    const projectionIndex = updatedProjections.length - 1;
    
    // Update the projection inputs state
    setProjectionInputs({
      ...projectionInputs,
      [`${statementIndex}.${projectionIndex}.monthly_payout`]: "0",
      [`${statementIndex}.${projectionIndex}.total_capital`]: "0"
    });
    
    // Increment the counter to force a re-render
    setProjectionCounter(prev => prev + 1);
    
    // Update our direct state tracking
    setStatementsWithProjections(prev => ({
      ...prev,
      [statementIndex]: updatedProjections
    }));
    
    // Force re-render
    setTimeout(() => {
      // This will force React Hook Form to update the UI
      form.trigger();
    }, 0);
  }
  
  const handleRemoveProjection = (statementIndex: number, projectionIndex: number) => {
    // Get the current form values
    const formValues = form.getValues() as CompanyPensionFormData;
    
    // Ensure statements array exists
    if (!formValues.statements || !formValues.statements[statementIndex]) {
      return;
    }
    
    // Get current retirement projections or initialize as empty array
    const currentProjections = Array.isArray(formValues.statements[statementIndex].retirement_projections) 
      ? [...formValues.statements[statementIndex].retirement_projections] 
      : [];
    
    // If there are no projections, nothing to remove
    if (currentProjections.length === 0) {
      return;
    }
    
    // Remove the projection
    currentProjections.splice(projectionIndex, 1);
    
    // Update just the retirement_projections field
    form.setValue(`statements.${statementIndex}.retirement_projections`, currentProjections, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    // Remove entries from projectionInputs
    const newProjectionInputs = { ...projectionInputs };
    delete newProjectionInputs[`${statementIndex}.${projectionIndex}.monthly_payout`];
    delete newProjectionInputs[`${statementIndex}.${projectionIndex}.total_capital`];
    
    // Update keys for projections that come after the removed one
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
    
    // Increment the counter to force a re-render
    setProjectionCounter(prev => prev + 1);
    
    // Update our direct state tracking
    setStatementsWithProjections(prev => ({
      ...prev,
      [statementIndex]: currentProjections
    }));
    
    // Force re-render
    setTimeout(() => {
      // This will force React Hook Form to update the UI
      form.trigger();
    }, 0);
  }

  const handleDurationSelect = (index: number, years?: number) => {
    const startDate = form.getValues(`contribution_plan_steps.${index}.start_date`)
    const memberId = form.getValues('member_id')
    
    if (!startDate) return
    
    if (years === undefined) {
      const member = members.find(m => m.id === parseInt(memberId))
      if (!member?.birthday) {
        form.setValue(`contribution_plan_steps.${index}.end_date`, undefined)
        setOpen(null)
        return
      }
      const retirementDate = new Date(member.birthday)
      retirementDate.setFullYear(retirementDate.getFullYear() + 67) // Default retirement age
      form.setValue(`contribution_plan_steps.${index}.end_date`, retirementDate)
      setOpen(null)
      return
    }

    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)
    form.setValue(`contribution_plan_steps.${index}.end_date`, endDate)
    setOpen(null)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 p-6 rounded-lg border bg-card">
        <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="My Company Plan" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
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
            name="employer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employer</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Company Name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contribution_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regular Contribution Amount {currencyDisplay && `(${currencyDisplay})`}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={contributionAmountInput}
                      onChange={(e) => {
                        const newValue = e.target.value
                        if (isValidNumberFormat(newValue)) {
                          setContributionAmountInput(newValue)
                          const parsedValue = parseNumber(newValue, settings.number_locale)
                          if (parsedValue >= 0) {
                            field.onChange(parsedValue)
                          }
                        }
                      }}
                      onBlur={() => {
                        const value = parseNumber(contributionAmountInput, settings.number_locale)
                        if (value >= 0) {
                          setContributionAmountInput(value.toString().replace('.', decimalSeparator))
                          field.onChange(value)
                        } else {
                          setContributionAmountInput("")
                          field.onChange(undefined)
                        }
                        field.onBlur()
                      }}
                      placeholder={placeholder}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contribution_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contribution Frequency</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ContributionFrequency.MONTHLY}>Monthly</SelectItem>
                    <SelectItem value={ContributionFrequency.QUARTERLY}>Quarterly</SelectItem>
                    <SelectItem value={ContributionFrequency.SEMI_ANNUALLY}>Semi-Annually</SelectItem>
                    <SelectItem value={ContributionFrequency.ANNUALLY}>Annually</SelectItem>
                    <SelectItem value={ContributionFrequency.ONE_TIME}>One-Time</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Additional information about this pension" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-6 p-6 rounded-lg border bg-card">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-medium">Contribution Plan</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddContribution}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contribution
          </Button>
        </div>

        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-end">
              <FormField
                control={form.control}
                name={`contribution_plan_steps.${index}.amount`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount {currencyDisplay && `(${currencyDisplay})`}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={contributionInputs[index] || ""}
                          onChange={(e) => {
                            const newValue = e.target.value
                            if (isValidNumberFormat(newValue)) {
                              const newInputs = [...contributionInputs]
                              newInputs[index] = newValue
                              setContributionInputs(newInputs)
                              
                              const parsedValue = parseNumber(newValue, settings.number_locale)
                              if (parsedValue >= 0) {
                                field.onChange(parsedValue)
                              }
                            }
                          }}
                          onBlur={() => {
                            const value = parseNumber(contributionInputs[index] || "", settings.number_locale)
                            if (value >= 0) {
                              const newInputs = [...contributionInputs]
                              newInputs[index] = value.toString().replace('.', decimalSeparator)
                              setContributionInputs(newInputs)
                              field.onChange(value)
                            } else {
                              const newInputs = [...contributionInputs]
                              newInputs[index] = ""
                              setContributionInputs(newInputs)
                              field.onChange(0)
                            }
                            field.onBlur()
                          }}
                          placeholder={placeholder}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`contribution_plan_steps.${index}.frequency`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ContributionFrequency.MONTHLY}>Monthly</SelectItem>
                        <SelectItem value={ContributionFrequency.QUARTERLY}>Quarterly</SelectItem>
                        <SelectItem value={ContributionFrequency.SEMI_ANNUALLY}>Semi-Annually</SelectItem>
                        <SelectItem value={ContributionFrequency.ANNUALLY}>Annually</SelectItem>
                        <SelectItem value={ContributionFrequency.ONE_TIME}>One-Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`contribution_plan_steps.${index}.start_date`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
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
                name={`contribution_plan_steps.${index}.end_date`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <div className="flex space-x-2">
                      <Popover open={open === index} onOpenChange={(isOpen) => setOpen(isOpen ? index : null)}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                            type="button"
                          >
                            {field.value ? new Date(field.value).toLocaleDateString(settings.ui_locale) : "Select duration"}
                            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                          <Command>
                            <CommandList>
                              <CommandGroup>
                                <CommandItem onSelect={() => handleDurationSelect(index, 1)}>
                                  1 year
                                </CommandItem>
                                <CommandItem onSelect={() => handleDurationSelect(index, 3)}>
                                  3 years
                                </CommandItem>
                                <CommandItem onSelect={() => handleDurationSelect(index, 5)}>
                                  5 years
                                </CommandItem>
                                <CommandItem onSelect={() => handleDurationSelect(index, 10)}>
                                  10 years
                                </CommandItem>
                                <CommandItem onSelect={() => handleDurationSelect(index)}>
                                  Until retirement
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  remove(index)
                  const newInputs = [...contributionInputs]
                  newInputs.splice(index, 1)
                  setContributionInputs(newInputs)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-6 p-6 rounded-lg border bg-card">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-medium">Pension Statements</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStatement}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Statement
          </Button>
        </div>

        <div className="space-y-8">
          {statementFields.map((statementField, statementIndex) => {
            return (
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
                        <FormLabel>Value {currencyDisplay && `(${currencyDisplay})`}</FormLabel>
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
                              placeholder={placeholder}
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
                      onClick={() => {
                        handleAddProjectionToStatement(statementIndex);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Projection
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {(() => {
                      // Get projections from our state or from the form
                      const projections = statementsWithProjections[statementIndex] || 
                        form.getValues()?.statements?.[statementIndex]?.retirement_projections || [];
                      
                      // Using projectionCounter in the key to force re-render
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
                                <FormLabel>Monthly Payout {currencyDisplay && `(${currencyDisplay})`}</FormLabel>
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
                                      placeholder={placeholder}
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
                                <FormLabel>Total Capital {currencyDisplay && `(${currencyDisplay})`}</FormLabel>
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
                                      placeholder={placeholder}
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
            )
          })}
        </div>
      </div>
    </div>
  )
} 