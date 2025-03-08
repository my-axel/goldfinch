"use client"

import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { Form, FormField } from "@/frontend/components/ui/form"
import { Button } from "@/frontend/components/ui/button"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { PensionType } from "@/frontend/types/pension"
import { usePension } from "@/frontend/context/pension"
import { toast } from "sonner"
import { getPensionListRoute } from "@/frontend/lib/routes"
import { zodResolver } from "@hookform/resolvers/zod"
import { etfPensionSchema } from "@/frontend/lib/validations/pension"
import { ErrorBoundary } from "@/frontend/components/shared/ErrorBoundary"
import { FormLayout, FormSection } from "@/frontend/components/shared"
import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/frontend/components/ui/radio-group"
import { Label } from "@/frontend/components/ui/label"
import { PlusCircle, History, BarChart3 } from "lucide-react"
import { ETFSearchCombobox } from "@/frontend/components/etf/ETFSearchCombobox"
import { Input } from "@/frontend/components/ui/input"
import { useSettings } from "@/frontend/context/SettingsContext"
import { parseNumber, getDecimalSeparator } from "@/frontend/lib/transforms"
import { ContributionPlanCard } from "@/frontend/components/pension/etf/ContributionPlanCard"

export default function NewETFPensionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createEtfPension } = usePension()
  const { settings } = useSettings()
  const [initializationMethod, setInitializationMethod] = useState<"new" | "existing" | "historical" | null>(null)
  const [unitsInput, setUnitsInput] = useState("")
  const decimalSeparator = getDecimalSeparator(settings.number_locale)

  const form = useForm<ETFPensionFormData>({
    resolver: zodResolver(etfPensionSchema),
    defaultValues: {
      type: PensionType.ETF_PLAN,
      name: "",
      member_id: searchParams.get('member_id') || "",
      etf_id: "",
      contribution_plan_steps: [],
      is_existing_investment: false,
      existing_units: 0,
      reference_date: new Date(),
      initialization_method: "none"
    }
  })

  const handleInitializationMethodChange = (value: "new" | "existing" | "historical") => {
    setInitializationMethod(value)
    form.setValue('initialization_method', value)
    form.setValue('is_existing_investment', value === 'existing')
    form.setValue('realize_historical_contributions', value === 'historical')
  }

  // Validate if the input is a valid number format
  const isValidNumberFormat = (value: string): boolean => {
    // Allow empty input
    if (!value) return true
    
    // Allow only digits, one decimal separator, and one minus sign at the start
    const regex = new RegExp(`^-?\\d*\\${decimalSeparator}?\\d*$`)
    return regex.test(value)
  }

  const handleSubmit = async (data: ETFPensionFormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", { description: "Invalid member ID" })
        return
      }

      await createEtfPension({
        type: PensionType.ETF_PLAN,
        name: data.name,
        member_id: memberId,
        etf_id: data.etf_id,
        is_existing_investment: data.is_existing_investment,
        existing_units: data.existing_units,
        reference_date: data.reference_date,
        contribution_plan_steps: data.contribution_plan_steps,
        realize_historical_contributions: data.initialization_method === "historical",
        status: "ACTIVE",
        total_units: data.is_existing_investment ? data.existing_units : 0,
        notes: data.notes
      })

      toast.success("Success", { description: "ETF pension created successfully" })
      router.push(getPensionListRoute())
      router.refresh()
    } catch (error) {
      console.error('Failed to create pension:', error)
      // Error is handled by the context
    }
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create ETF Pension Plan</h1>
            <p className="text-muted-foreground mt-2">
              Set up a new ETF-based pension plan. You&apos;ll need to select an ETF
              and set up your contribution plan.
            </p>
          </div>
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" form="etf-pension-form">
              Create Pension
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="etf-pension-form" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormLayout>
              {/* Initialization Method Section */}
              <FormSection
                title="Initialization Method"
                description="Choose how you want to set up your ETF pension plan"
              >
                <div className="space-y-4">
                  <RadioGroup
                    onValueChange={(value) => handleInitializationMethodChange(value as "new" | "existing" | "historical")}
                    className="space-y-0"
                    value={initializationMethod || ""}
                  >
                    <Label
                      htmlFor="new"
                      className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer block group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <RadioGroupItem value="new" id="new" />
                          <PlusCircle className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                          <Label htmlFor="new" className="font-medium">
                            New Investment
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground pl-9">
                          Start a new ETF investment from scratch. You&apos;ll be able to set up your initial 
                          investment and contribution plan.
                        </p>
                      </div>
                    </Label>

                    <Label
                      htmlFor="existing"
                      className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer block group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <RadioGroupItem value="existing" id="existing" />
                          <BarChart3 className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                          <Label htmlFor="existing" className="font-medium">
                            Existing Investment
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground pl-9">
                          Track an existing ETF investment. You&apos;ll be able to enter your current holdings 
                          and set up future contributions.
                        </p>
                      </div>
                    </Label>

                    <Label
                      htmlFor="historical"
                      className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer block group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <RadioGroupItem value="historical" id="historical" />
                          <History className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                          <Label htmlFor="historical" className="font-medium">
                            Historical Contributions
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground pl-9">
                          Import historical contribution data. This will help track your investment&apos;s 
                          performance over time.
                        </p>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>
              </FormSection>

              {initializationMethod && (
                <>
                  {/* Basic Information Section */}
                  <FormSection
                    title="Basic Information"
                    description="Enter the basic details of your ETF pension plan"
                  >
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" {...field} placeholder="My ETF Investment" />
                              </div>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name="etf_id"
                            render={({ field }) => (
                              <div className="space-y-2">
                                <Label htmlFor="etf">ETF</Label>
                                <ETFSearchCombobox
                                  value={field.value}
                                  onSelect={(etf) => field.onChange(etf.id)}
                                  readOnly={false}
                                />
                              </div>
                            )}
                          />
                        </div>
                      </div>

                      {initializationMethod === 'existing' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <FormField
                              control={form.control}
                              name="existing_units"
                              render={({ field }) => (
                                <div className="space-y-2">
                                  <Label htmlFor="existing_units">Current Units</Label>
                                  <Input 
                                    id="existing_units"
                                    type="text"
                                    inputMode="decimal"
                                    value={unitsInput}
                                    onChange={(e) => {
                                      const newValue = e.target.value
                                      if (isValidNumberFormat(newValue)) {
                                        setUnitsInput(newValue)
                                        const parsedValue = parseNumber(newValue, settings.number_locale)
                                        if (parsedValue >= 0) {
                                          field.onChange(parsedValue)
                                        }
                                      }
                                    }}
                                    onBlur={() => {
                                      const value = parseNumber(unitsInput, settings.number_locale)
                                      if (value >= 0) {
                                        setUnitsInput(value.toString().replace('.', decimalSeparator))
                                        field.onChange(value)
                                      } else {
                                        setUnitsInput("")
                                        field.onChange(0)
                                      }
                                      field.onBlur()
                                    }}
                                    placeholder={`0${decimalSeparator}000000`}
                                  />
                                </div>
                              )}
                            />
                          </div>
                          <div>
                            <FormField
                              control={form.control}
                              name="reference_date"
                              render={({ field }) => (
                                <div className="space-y-2">
                                  <Label htmlFor="reference_date">Reference Date</Label>
                                  <Input
                                    id="reference_date"
                                    type="date"
                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                      const date = new Date(e.target.value)
                                      date.setUTCHours(0, 0, 0, 0)
                                      field.onChange(date)
                                    }}
                                  />
                                </div>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </FormSection>

                  {/* Contribution Plan Section */}
                  <FormSection
                    title="Contribution Plan"
                    description="Set up your contribution schedule"
                  >
                    <ContributionPlanCard form={form} />
                  </FormSection>
                </>
              )}
            </FormLayout>
          </form>
        </Form>
      </div>
    </ErrorBoundary>
  )
} 