"use client"

import { UseFormReturn } from "react-hook-form"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { EditETFPensionBasicInformationForm } from "./EditETFPensionBasicInformationForm"
import { EditETFPensionContributionStepsForm } from "./EditETFPensionContributionStepsForm"

interface EditETFPensionFormProps {
  form: UseFormReturn<ETFPensionFormData>
}

/**
 * Form component for editing ETF-specific pension fields.
 * Handles ETF selection and contribution plan management.
 */
export function EditETFPensionForm({ form }: EditETFPensionFormProps) {
  return (
    <div className="space-y-6">
      <EditETFPensionBasicInformationForm form={form} />
      <EditETFPensionContributionStepsForm form={form} />
    </div>
  )
} 