"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { CompanyPensionFormData } from "@/frontend/types/pension-form"
import { Button } from "@/frontend/components/ui/button"
import { PauseCircle, PlayCircle } from "lucide-react"
import { ContributionFrequency } from "@/frontend/types/pension"
import { Input } from "@/frontend/components/ui/input"
import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { usePension } from "@/frontend/context/pension"
import { parseNumber, getDecimalSeparator, getCurrencySymbol } from "@/frontend/lib/transforms"
import { Badge } from "@/frontend/components/ui/badge"
import { PensionStatusUpdate } from "@/frontend/types/pension-statistics"
import { PauseConfirmationDialog } from "@/frontend/components/pension/shared/dialogs/PauseConfirmationDialog"
import { ResumeDateDialog } from "@/frontend/components/pension/shared/dialogs/ResumeDateDialog"
import { CompanyPension } from "@/frontend/types/pension"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card"
import { EnumSelect } from "@/frontend/components/ui/enum-select"
import { DateInput } from '@/frontend/components/ui/date-input'

interface BasicInformationCardProps {
  form: UseFormReturn<CompanyPensionFormData>
}

/**
 * Card component for editing basic company pension information.
 * Handles name, employer, dates, and contribution details.
 */
export function BasicInformationCard({ form }: BasicInformationCardProps) {
  const { settings } = useSettings()
  const { selectedPension, updatePensionStatus } = usePension()
  const [contributionAmountInput, setContributionAmountInput] = useState("")
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const decimalSeparator = getDecimalSeparator(settings.number_locale)
  const currencySymbol = getCurrencySymbol(settings.number_locale, settings.currency)

  // Cast selectedPension to CompanyPension since we know this component is only used for Company pensions
  const companyPension = selectedPension as CompanyPension | null
  
  // Initialize input states when form data changes
  useEffect(() => {
    const contributionAmount = form.getValues("contribution_amount")
    if (contributionAmount !== undefined) {
      setContributionAmountInput(contributionAmount.toString().replace('.', decimalSeparator))
    }
  }, [form, decimalSeparator])

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
    if (!value) return true
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div className="space-y-1.5">
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Manage your company pension plan details and status
            </CardDescription>
          </div>
          {companyPension && (
            <div className="flex items-center gap-3">
              <Badge variant={companyPension.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {companyPension.status === 'ACTIVE' ? 'Active' : 'Paused'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  if (companyPension.status === 'ACTIVE') {
                    setShowPauseDialog(true)
                  } else {
                    setShowResumeDialog(true)
                  }
                }}
              >
                {companyPension.status === 'ACTIVE' ? (
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
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-8">
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <DateInput
                    field={field}
                    label="Start Date"
                  />
                )}
              />

              <FormField
                control={form.control}
                name="contribution_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regular Contribution {currencySymbol && `(${currencySymbol})`}</FormLabel>
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

              <EnumSelect<ContributionFrequency, CompanyPensionFormData>
                name="contribution_frequency"
                control={form.control}
                label="Contribution Frequency"
                options={[
                  { value: ContributionFrequency.MONTHLY, label: "Monthly" },
                  { value: ContributionFrequency.QUARTERLY, label: "Quarterly" },
                  { value: ContributionFrequency.SEMI_ANNUALLY, label: "Semi-Annually" },
                  { value: ContributionFrequency.ANNUALLY, label: "Annually" },
                  { value: ContributionFrequency.ONE_TIME, label: "One-Time" }
                ]}
                defaultValue={companyPension?.contribution_frequency || ContributionFrequency.MONTHLY}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
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

      {companyPension && (
        <>
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
      )}
    </>
  )
} 