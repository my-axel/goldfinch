"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { Plus, Trash2, ChevronDownIcon, PauseCircle, PlayCircle } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Input } from "@/frontend/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/frontend/components/ui/command"
import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { usePension } from "@/frontend/context/PensionContext"
import { parseNumber, getDecimalSeparator, getCurrencySymbol } from "@/frontend/lib/transforms"
import { Badge } from "@/frontend/components/ui/badge"
import { PensionStatusUpdate } from "@/frontend/types/pension-statistics"
import { PauseConfirmationDialog } from "@/frontend/components/pension/shared/dialogs/PauseConfirmationDialog"
import { ResumeDateDialog } from "@/frontend/components/pension/shared/dialogs/ResumeDateDialog"
import { CompanyPension } from "@/frontend/types/pension"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card"

interface EditCompanyPensionFormProps {
  form: UseFormReturn<CompanyPensionFormData>
}

/**
 * Form component for editing company-specific pension fields.
 * Handles employer details and contribution plan management.
 */
export function EditCompanyPensionForm({ form }: EditCompanyPensionFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contribution_plan_steps"
  })
  
  const { fields: projectionFields, append: appendProjection, remove: removeProjection } = useFieldArray({
    control: form.control,
    name: "projections"
  })
  
  const { settings } = useSettings()
  const { selectedPension, updatePensionStatus } = usePension()
  const [open, setOpen] = useState<number | null>(null)
  const [contributionAmountInput, setContributionAmountInput] = useState("")
  const [contributionInputs, setContributionInputs] = useState<string[]>([])
  const [projectionInputs, setProjectionInputs] = useState<{[key: string]: string}>({})
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const decimalSeparator = getDecimalSeparator(settings.number_locale)
  const currencySymbol = getCurrencySymbol(settings.number_locale, settings.currency)

  // Cast selectedPension to CompanyPension since we know this component is only used for Company pensions
  const companyPension = selectedPension as CompanyPension | null

  // Initialize input states when form data changes
  useEffect(() => {
    const contributionSteps = form.getValues("contribution_plan_steps");
    const projections = form.getValues("projections");
    
    // Initialize contribution inputs
    if (contributionSteps && contributionSteps.length > 0) {
      const newContributionInputs = contributionSteps.map(step => 
        step.amount ? step.amount.toString().replace('.', decimalSeparator) : ""
      );
      setContributionInputs(newContributionInputs);
    }
    
    // Initialize projection inputs
    if (projections && projections.length > 0) {
      const newProjectionInputs: {[key: string]: string} = {};
      projections.forEach((projection, index) => {
        newProjectionInputs[`${index}.monthly_payout`] = projection.monthly_payout 
          ? projection.monthly_payout.toString().replace('.', decimalSeparator) 
          : "";
        newProjectionInputs[`${index}.total_capital`] = projection.total_capital 
          ? projection.total_capital.toString().replace('.', decimalSeparator) 
          : "";
      });
      setProjectionInputs(newProjectionInputs);
    }
  }, [form, decimalSeparator]);

  const handlePause = async (pauseDate: Date) => {
    if (!companyPension) return

    const status: PensionStatusUpdate = {
      status: 'PAUSED',
      paused_at: pauseDate.toISOString().split('T')[0]
    }

    await updatePensionStatus(companyPension.id, status)
    setShowPauseDialog(false)
  }

  const handleResume = async (resumeDate: Date) => {
    if (!companyPension) return

    const status: PensionStatusUpdate = {
      status: 'ACTIVE',
      resume_at: resumeDate.toISOString().split('T')[0]
    }

    await updatePensionStatus(companyPension.id, status)
    setShowResumeDialog(false)
  }

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

    // If there are existing contributions, check the last one's end date
    if (fields.length > 0) {
      const lastEndDate = form.getValues(`contribution_plan_steps.${fields.length - 1}.end_date`)
      
      if (lastEndDate) {
        // Use the day after the last end date as the start date
        startDate = new Date(lastEndDate)
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
  
  const handleAddProjection = () => {
    appendProjection({
      retirement_age: 67,
      monthly_payout: 0,
      total_capital: 0
    })
    
    // Add new entries to the projectionInputs object
    const newIndex = projectionFields.length
    setProjectionInputs({
      ...projectionInputs,
      [`${newIndex}.monthly_payout`]: "",
      [`${newIndex}.total_capital`]: ""
    })
  }

  const handleDurationSelect = (index: number, years?: number) => {
    const startDate = form.getValues(`contribution_plan_steps.${index}.start_date`)
    
    if (!startDate) return
    
    if (years === undefined) {
      // Set no end date for "until retirement" option
      form.setValue(`contribution_plan_steps.${index}.end_date`, undefined)
      setOpen(null)
      return
    }

    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)
    form.setValue(`contribution_plan_steps.${index}.end_date`, endDate)
    setOpen(null)
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <div className="space-y-1.5">
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Manage your company pension plan details and status
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={companyPension?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {companyPension?.status === 'ACTIVE' ? 'Active' : 'Paused'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  if (companyPension?.status === 'ACTIVE') {
                    setShowPauseDialog(true)
                  } else {
                    setShowResumeDialog(true)
                  }
                }}
              >
                {companyPension?.status === 'ACTIVE' ? (
                  <>
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_2fr] gap-8">
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
                name="contribution_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regular Contribution ({currencySymbol})</FormLabel>
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
                name="latest_statement_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latest Statement Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const date = new Date(e.target.value)
                            date.setUTCHours(0, 0, 0, 0)
                            field.onChange(date)
                          } else {
                            field.onChange(undefined)
                          }
                        }}
                      />
                    </FormControl>
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
          </CardContent>
        </Card>

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
                      <FormLabel>Amount ({currencySymbol})</FormLabel>
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
            <h3 className="text-lg font-medium">Retirement Projections</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProjection}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Projection
            </Button>
          </div>

          <div className="space-y-6">
            {projectionFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
                <FormField
                  control={form.control}
                  name={`projections.${index}.retirement_age`}
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
                  name={`projections.${index}.monthly_payout`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Payout ({currencySymbol})</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={projectionInputs[`${index}.monthly_payout`] || ""}
                            onChange={(e) => {
                              const newValue = e.target.value
                              if (isValidNumberFormat(newValue)) {
                                setProjectionInputs({
                                  ...projectionInputs,
                                  [`${index}.monthly_payout`]: newValue
                                })
                                
                                const parsedValue = parseNumber(newValue, settings.number_locale)
                                if (parsedValue >= 0) {
                                  field.onChange(parsedValue)
                                }
                              }
                            }}
                            onBlur={() => {
                              const value = parseNumber(projectionInputs[`${index}.monthly_payout`] || "", settings.number_locale)
                              if (value >= 0) {
                                setProjectionInputs({
                                  ...projectionInputs,
                                  [`${index}.monthly_payout`]: value.toString().replace('.', decimalSeparator)
                                })
                                field.onChange(value)
                              } else {
                                setProjectionInputs({
                                  ...projectionInputs,
                                  [`${index}.monthly_payout`]: ""
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
                  name={`projections.${index}.total_capital`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Capital ({currencySymbol})</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={projectionInputs[`${index}.total_capital`] || ""}
                            onChange={(e) => {
                              const newValue = e.target.value
                              if (isValidNumberFormat(newValue)) {
                                setProjectionInputs({
                                  ...projectionInputs,
                                  [`${index}.total_capital`]: newValue
                                })
                                
                                const parsedValue = parseNumber(newValue, settings.number_locale)
                                if (parsedValue >= 0) {
                                  field.onChange(parsedValue)
                                }
                              }
                            }}
                            onBlur={() => {
                              const value = parseNumber(projectionInputs[`${index}.total_capital`] || "", settings.number_locale)
                              if (value >= 0) {
                                setProjectionInputs({
                                  ...projectionInputs,
                                  [`${index}.total_capital`]: value.toString().replace('.', decimalSeparator)
                                })
                                field.onChange(value)
                              } else {
                                setProjectionInputs({
                                  ...projectionInputs,
                                  [`${index}.total_capital`]: ""
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
                  onClick={() => {
                    removeProjection(index)
                    const newInputs = { ...projectionInputs }
                    delete newInputs[`${index}.monthly_payout`]
                    delete newInputs[`${index}.total_capital`]
                    setProjectionInputs(newInputs)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PauseConfirmationDialog
        open={showPauseDialog}
        onOpenChange={setShowPauseDialog}
        onConfirm={handlePause}
      />

      <ResumeDateDialog
        open={showResumeDialog}
        onOpenChange={setShowResumeDialog}
        onConfirm={handleResume}
      />
    </>
  )
} 