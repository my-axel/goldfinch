"use client"

import { useWatch, type UseFormReturn } from "react-hook-form"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency } from "@/frontend/lib/transforms"
import {
  Explanation,
  ExplanationHeader,
  ExplanationContent,
} from "@/frontend/components/ui/explanation"
import { TrendingUp } from "lucide-react"
import { type ETFPensionFormData } from "@/frontend/types/pension-form"
import { type ContributionStep } from "@/frontend/types/pension"

function analyzeContributionStep(
  step: ContributionStep,
  allSteps: ContributionStep[],
  retirementDate: Date
) {
  // Calculate the duration of this step
  const stepStart = new Date(step.start_date)
  const stepEnd = step.end_date ? new Date(step.end_date) : retirementDate
  const stepDurationYears = (stepEnd.getTime() - stepStart.getTime()) / (1000 * 60 * 60 * 24 * 365)

  // Calculate smart increase for this specific step
  let suggestedIncrease: number
  if (step.amount < 100) {
    suggestedIncrease = Math.ceil(step.amount / 25) * 25 + 25 - step.amount
  } else if (step.amount < 500) {
    suggestedIncrease = Math.ceil(step.amount / 50) * 50 + 50 - step.amount
  } else if (step.amount < 1000) {
    suggestedIncrease = Math.ceil(step.amount / 100) * 100 + 100 - step.amount
  } else {
    suggestedIncrease = Math.ceil(step.amount / 250) * 250 + 250 - step.amount
  }

  const suggestedAmount = step.amount + suggestedIncrease

  // For steps without end date, we calculate directly until retirement
  if (!step.end_date) {
    const yearsUntilRetirement = (retirementDate.getTime() - stepStart.getTime()) / (1000 * 60 * 60 * 24 * 365)
    const monthlyReturnRate = Math.pow(1 + 7 / 100, 1/12) - 1
    const months = yearsUntilRetirement * 12

    // Calculate total accumulation with current amount
    const baseAccumulation = step.amount * (Math.pow(1 + monthlyReturnRate, months) - 1) / monthlyReturnRate

    // Calculate total accumulation with suggested amount
    const suggestedAccumulation = suggestedAmount * (Math.pow(1 + monthlyReturnRate, months) - 1) / monthlyReturnRate

    return {
      currentAmount: step.amount,
      suggestedAmount,
      additionalMonthly: suggestedIncrease,
      additionalAtStepEnd: suggestedAccumulation - baseAccumulation,
      additionalAtRetirement: suggestedAccumulation - baseAccumulation, // Same as additionalAtStepEnd in this case
      stepDurationYears: yearsUntilRetirement,
      isCurrentStep: stepStart <= new Date(),
      isUntilRetirement: true
    }
  }

  // Original calculation for steps with end date
  const monthlyReturnRate = Math.pow(1 + 7 / 100, 1/12) - 1
  const monthsInStep = stepDurationYears * 12

  // Calculate base accumulation during this step
  const baseAccumulation = step.amount * (Math.pow(1 + monthlyReturnRate, monthsInStep) - 1) / monthlyReturnRate

  // Calculate accumulation with suggested amount
  const suggestedAccumulation = suggestedAmount * (Math.pow(1 + monthlyReturnRate, monthsInStep) - 1) / monthlyReturnRate

  // Calculate how this compounds until retirement
  const yearsUntilRetirement = (retirementDate.getTime() - stepEnd.getTime()) / (1000 * 60 * 60 * 24 * 365)
  const baseAtRetirement = baseAccumulation * Math.pow(1 + 7 / 100, yearsUntilRetirement)
  const suggestedAtRetirement = suggestedAccumulation * Math.pow(1 + 7 / 100, yearsUntilRetirement)

  return {
    currentAmount: step.amount,
    suggestedAmount,
    additionalMonthly: suggestedIncrease,
    additionalAtStepEnd: suggestedAccumulation - baseAccumulation,
    additionalAtRetirement: suggestedAtRetirement - baseAtRetirement,
    stepDurationYears,
    isCurrentStep: stepStart <= new Date() && (!step.end_date || stepEnd > new Date()),
    isUntilRetirement: false
  }
}

interface ContributionImpactAnalysisProps {
  form: UseFormReturn<ETFPensionFormData>
  retirementDate?: Date
}

export function ContributionImpactAnalysis({ form, retirementDate }: ContributionImpactAnalysisProps) {
  const { settings } = useSettings()
  const contributions = useWatch({
    control: form.control,
    name: "contribution_plan_steps"
  })

  // Also watch the form's touched fields to detect which step is being modified
  const { touchedFields } = form.formState
  
  if (!retirementDate || contributions.length === 0) return null

  // Find the step that's currently being edited
  let currentStep = contributions[0]
  if (touchedFields.contribution_plan_steps) {
    const touchedSteps = touchedFields.contribution_plan_steps as Record<number, Record<string, boolean>>
    const lastTouchedIndex = Object.keys(touchedSteps)
      .map(Number)
      .sort((a, b) => b - a)[0]
    
    if (lastTouchedIndex !== undefined) {
      currentStep = contributions[lastTouchedIndex]
    }
  }

  // If no step is being edited, find the current active step
  if (!currentStep) {
    currentStep = contributions.find(step => {
      const start = new Date(step.start_date)
      const end = step.end_date ? new Date(step.end_date) : retirementDate
      return start <= new Date() && end > new Date()
    }) || contributions[0]
  }

  const analysis = analyzeContributionStep(currentStep, contributions, retirementDate)

  // Don't show anything if there's no meaningful change
  if (analysis.additionalMonthly <= 0) return null

  return (
    <Explanation className="space-y-0">
      <ExplanationHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" /> 
          <span>Growth Opportunity</span>
        </div>
      </ExplanationHeader>
      <ExplanationContent className="space-y-0">
            Increasing your {currentStep.frequency.toLowerCase()} contribution to{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(analysis.suggestedAmount, {
                locale: settings.number_locale,
                currency: settings.currency
              }).formatted}
            </span>
            {analysis.isUntilRetirement ? (
              ' until retirement'
            ) : (
              ` for this ${analysis.stepDurationYears.toFixed(1)} year period`
            )}
            {' '}could add{' '}
            <span className="font-medium text-green-600">
              {formatCurrency(analysis.additionalAtRetirement, {
                locale: settings.number_locale,
                currency: settings.currency
              }).formatted}
            </span>
            {' '}to your retirement savings.
      </ExplanationContent>
    </Explanation>
  )
}