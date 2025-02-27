"use client"

import { 
  Explanation, 
  ExplanationHeader, 
  ExplanationContent, 
  ExplanationStats,
  ExplanationStat
} from "@/frontend/components/ui/explanation"
import { formatCurrency } from "@/frontend/lib/transforms"

interface ProjectionPreviewProps {
  locale: string
  currency: string
  rates: {
    inflation_rate: number | string
    projection_pessimistic_rate: number | string
    projection_realistic_rate: number | string
    projection_optimistic_rate: number | string
  }
}

interface ProjectionParams {
  currentValue: number
  monthlyContribution: number
  yearsToRetirement: number
}

function calculateProjection(
  { currentValue, monthlyContribution, yearsToRetirement }: ProjectionParams,
  annualRate: number,
  inflationRate: number = 0
): number {
  const monthlyRate = annualRate / 100 / 12
  const monthlyInflationRate = inflationRate / 100 / 12
  const months = yearsToRetirement * 12
  
  // Future value of current principal
  const futureValue = currentValue * Math.pow(1 + monthlyRate, months)
  
  // Future value of monthly contributions
  const contributionValue = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  
  const nominalValue = futureValue + contributionValue
  
  // Apply inflation adjustment if inflation rate is provided
  if (inflationRate > 0) {
    return nominalValue / Math.pow(1 + monthlyInflationRate, months)
  }
  
  return nominalValue
}

export function ProjectionPreview({ locale, currency, rates }: ProjectionPreviewProps) {
  // Convert rates to numbers
  const inflationRate = Number(rates.inflation_rate)
  const pessimisticRate = Number(rates.projection_pessimistic_rate)
  const realisticRate = Number(rates.projection_realistic_rate)
  const optimisticRate = Number(rates.projection_optimistic_rate)

  // Example values for preview
  const previewProjection = {
    currentValue: 100000,
    monthlyContribution: 1000,
    yearsToRetirement: 30
  }

  return (
    <Explanation>
      <ExplanationHeader>Understanding Projection Rates</ExplanationHeader>
      <ExplanationContent>
        <p>
          These rates are used to calculate potential future values of your investments
          across different market scenarios, adjusted for inflation.
        </p>
      </ExplanationContent>

      <ExplanationHeader>Example</ExplanationHeader>
      <ExplanationContent>
        <p>A hypothetical portfolio of {formatCurrency(previewProjection.currentValue, {
              locale,
              currency,
              decimals: 0
            }).formatted} with a monthly contribution of {formatCurrency(previewProjection.monthlyContribution, {
              locale,
              currency,
              decimals: 0
            }).formatted}, a time horizon of {`${previewProjection.yearsToRetirement} years`} years and an inflation rate of {`${inflationRate.toFixed(1)}%`}.</p>
      </ExplanationContent>

      <ExplanationHeader>Projected Outcomes</ExplanationHeader>
      <ExplanationContent>
        <div className="space-y-4">
          <div>
            <ExplanationStats columns={3}>
              <div>
                <h4 className="font-medium text-sm mb-2">Pessimistic</h4>
                <div className="space-y-4">
                  <ExplanationStat
                    label="Nominal"
                    subValue={formatCurrency(calculateProjection(previewProjection, pessimisticRate), {
                      locale,
                      currency
                    }).formatted}
                    tooltip="The nominal value of your portfolio at the time of retirement, before inflation adjustments."
                  />
                  <ExplanationStat
                    label="Real"
                    subValue={formatCurrency(calculateProjection(previewProjection, pessimisticRate, inflationRate), {
                      locale,
                      currency
                    }).formatted}
                    tooltip="Adjusted for inflation, showing the purchasing power of your money at the time of retirement."
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Realistic</h4>
                <div className="space-y-4">
                  <ExplanationStat
                    label="Nominal"
                    subValue={formatCurrency(calculateProjection(previewProjection, realisticRate), {
                      locale,
                      currency
                    }).formatted}
                    tooltip="The nominal value of your portfolio at the time of retirement, before inflation adjustments."
                  />
                  <ExplanationStat
                    label="Real"
                    subValue={formatCurrency(calculateProjection(previewProjection, realisticRate, inflationRate), {
                      locale,
                      currency
                    }).formatted}
                    tooltip="Adjusted for inflation, showing the purchasing power of your money at the time of retirement."
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Optimistic</h4>
                <div className="space-y-4">
                  <ExplanationStat
                    label="Nominal"
                    subValue={formatCurrency(calculateProjection(previewProjection, optimisticRate), {
                      locale,
                      currency
                    }).formatted}
                    tooltip="The nominal value of your portfolio at the time of retirement, before inflation adjustments."
                  />
                  <ExplanationStat
                    label="Real"
                    subValue={formatCurrency(calculateProjection(previewProjection, optimisticRate, inflationRate), {
                      locale,
                      currency
                    }).formatted}
                    tooltip="Adjusted for inflation, showing the purchasing power of your money at the time of retirement."
                  />
                </div>
              </div>
            </ExplanationStats>
          </div>
        </div>
      </ExplanationContent>
    </Explanation>
  )
}