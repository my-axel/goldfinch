"use client"

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { Button } from "@/frontend/components/ui/button"
import { PauseCircle, PlayCircle } from "lucide-react"
import { PensionType } from "@/frontend/types/pension"
import { Input } from "@/frontend/components/ui/input"
import { useState, useEffect } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { usePension } from "@/frontend/context/pension"
import { parseNumber, formatPercent, formatNumberInput } from "@/frontend/lib/transforms"
import { PauseConfirmationDialog } from "@/frontend/components/pension/shared/dialogs/PauseConfirmationDialog"
import { ResumeDateDialog } from "@/frontend/components/pension/shared/dialogs/ResumeDateDialog"
import { InsurancePension } from "@/frontend/types/pension"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card"
import { EnumSelect, EnumOption } from "@/frontend/components/ui/enum-select"
import { DateInput } from '@/frontend/components/ui/date-input'
import { InsurancePensionFormData } from "@/frontend/types/pension-form"

interface BasicInformationCardProps {
  form: UseFormReturn<InsurancePensionFormData>
}

// Convert PensionType enum to options array
const pensionTypeOptions: EnumOption<PensionType>[] = Object.entries(PensionType).map(([key, value]) => ({
  value,
  label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}))

/**
 * Card component for editing basic insurance pension information.
 * Handles name, provider, type, dates, and interest rates.
 */
export function BasicInformationCard({ form }: BasicInformationCardProps) {
  const { settings } = useSettings()
  const { selectedPension, updatePensionStatus } = usePension()
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [guaranteedInterestInput, setGuaranteedInterestInput] = useState("")
  const [expectedReturnInput, setExpectedReturnInput] = useState("")

  // Cast selectedPension to InsurancePension since we know this component is only used for Insurance pensions
  const insurancePension = selectedPension as InsurancePension | null

  // Initialize input states when form data changes
  useEffect(() => {
    const guaranteedInterest = form.getValues("guaranteed_interest")
    const expectedReturn = form.getValues("expected_return")

    setGuaranteedInterestInput(formatNumberInput(guaranteedInterest, settings.number_locale))
    setExpectedReturnInput(formatNumberInput(expectedReturn, settings.number_locale))
  }, [form, settings.number_locale])

  // Handle number input changes with proper locale formatting
  const handleNumberInput = (value: string, field: "guaranteed_interest" | "expected_return") => {
    const newValue = value.trim()
    if (field === "guaranteed_interest") {
      setGuaranteedInterestInput(newValue)
    } else {
      setExpectedReturnInput(newValue)
    }

    // Only update form if value is valid
    if (newValue === "" || newValue === "-") {
      form.setValue(field, undefined)
      return
    }

    const parsedValue = parseNumber(newValue, settings.number_locale)
    form.setValue(field, parsedValue)
  }

  const handlePauseConfirm = async (pauseDate: Date) => {
    if (!selectedPension) return

    try {
      await updatePensionStatus(selectedPension.id, {
        status: 'PAUSED',
        paused_at: pauseDate.toISOString(),
      })
      setShowPauseDialog(false)
    } catch (error) {
      console.error('Error updating pension status:', error)
    }
  }

  const handleResumeConfirm = async (resumeDate: Date) => {
    if (!selectedPension) return

    try {
      await updatePensionStatus(selectedPension.id, {
        status: 'ACTIVE',
        resume_at: resumeDate.toISOString(),
      })
      setShowResumeDialog(false)
    } catch (error) {
      console.error('Error updating pension status:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Enter the basic details of your insurance pension plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name and Provider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Riester-Rente" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Insurance company name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Type and Contract Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={() => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <EnumSelect<PensionType, InsurancePensionFormData>
                    name="type"
                    control={form.control}
                    options={pensionTypeOptions}
                    defaultValue={PensionType.INSURANCE}
                    placeholder="Select pension type"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contract_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Number (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Policy or contract number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Start Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <DateInput field={field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Interest Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="guaranteed_interest"
            render={() => (
              <FormItem>
                <FormLabel>Guaranteed Interest Rate (%) (Optional)</FormLabel>
                <FormControl>
                  <Input
                    value={guaranteedInterestInput}
                    onChange={(e) => handleNumberInput(e.target.value, "guaranteed_interest")}
                    onBlur={() => {
                      const value = parseNumber(guaranteedInterestInput, settings.number_locale)
                      if (!isNaN(value)) {
                        setGuaranteedInterestInput(formatPercent(value / 100, {
                          locale: settings.number_locale,
                          decimals: 2
                        }).formatted.replace('%', ''))
                      }
                    }}
                    placeholder="e.g., 2.5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expected_return"
            render={() => (
              <FormItem>
                <FormLabel>Expected Return Rate (%) (Optional)</FormLabel>
                <FormControl>
                  <Input
                    value={expectedReturnInput}
                    onChange={(e) => handleNumberInput(e.target.value, "expected_return")}
                    onBlur={() => {
                      const value = parseNumber(expectedReturnInput, settings.number_locale)
                      if (!isNaN(value)) {
                        setExpectedReturnInput(formatPercent(value / 100, {
                          locale: settings.number_locale,
                          decimals: 2
                        }).formatted.replace('%', ''))
                      }
                    }}
                    placeholder="e.g., 4.0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status Controls */}
        {insurancePension && (
          <div className="flex justify-end space-x-2">
            {insurancePension.status === "ACTIVE" ? (
              <Button
                variant="outline"
                onClick={() => setShowPauseDialog(true)}
                type="button"
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause Contributions
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowResumeDialog(true)}
                type="button"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume Contributions
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <PauseConfirmationDialog
        open={showPauseDialog}
        onOpenChange={setShowPauseDialog}
        onConfirm={handlePauseConfirm}
      />
      <ResumeDateDialog
        open={showResumeDialog}
        onOpenChange={setShowResumeDialog}
        onConfirm={handleResumeConfirm}
      />
    </Card>
  )
}