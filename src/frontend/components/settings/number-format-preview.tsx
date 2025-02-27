"use client"

import { formatNumber, formatCurrency, formatDate } from "@/frontend/lib/transforms"
import { Explanation, ExplanationHeader, ExplanationStats, ExplanationStat } from "@/frontend/components/ui/explanation"
interface NumberFormatPreviewProps {
  locale: string
  currency: string
}

export function NumberFormatPreview({ locale, currency }: NumberFormatPreviewProps) {
  // Example values for preview
  const previewNumber = 1234567.89
  const previewDate = new Date("2024-02-23") // Use a fixed date to avoid hydration issues

  return (
    <Explanation>
        <ExplanationHeader>Format Preview</ExplanationHeader>
      <div className="space-y-2">
        <ExplanationStats>
          <ExplanationStat
            label="Number"
            subValue={formatNumber(previewNumber, { locale }).formatted}
          />
        <ExplanationStat
            label="Currency"
            subValue={formatCurrency(previewNumber, {
                locale,
                currency
              }).formatted}
          />
        <ExplanationStat
            label="Date"
            subValue={formatDate(previewDate, { locale }).formatted}
          />
        </ExplanationStats>
      </div>
    </Explanation>
  )
} 