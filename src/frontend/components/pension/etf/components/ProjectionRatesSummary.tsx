"use client"

/**
 * This component follows the formatting best practices documented in:
 * docs/frontend/guides/formatting-best-practices.md
 * 
 * It uses client-side only formatting with useState and useEffect to avoid hydration mismatches.
 */

import { TrendingDown, TrendingUp, ArrowRight, Wallet, Calendar } from "lucide-react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency, formatNumber } from "@/frontend/lib/transforms"
import { useState, useEffect } from "react"
import {
  Explanation,
  ExplanationHeader,
  ExplanationStats,
  ExplanationStat
} from "@/frontend/components/ui/explanation"
import { ProjectionScenario } from "@/frontend/types/projection"
import { format, differenceInYears } from "date-fns"

/**
 * Props for the ProjectionRatesSummary component
 * @interface ProjectionRatesSummaryProps
 * @property {Object} scenarios - Object containing the three projection scenarios
 * @property {ProjectionScenario} scenarios.pessimistic - Pessimistic scenario with lower returns
 * @property {ProjectionScenario} scenarios.realistic - Realistic scenario based on historical averages
 * @property {ProjectionScenario} scenarios.optimistic - Optimistic scenario with higher returns
 */
interface ProjectionRatesSummaryProps {
  scenarios: {
    pessimistic: ProjectionScenario
    realistic: ProjectionScenario
    optimistic: ProjectionScenario
  }
}

/**
 * ProjectionRatesSummary displays a comprehensive overview of retirement projections
 * including different scenarios (pessimistic, realistic, optimistic) and key metrics.
 * 
 * The component shows:
 * - Three projection scenarios with their final values and return rates
 * - Total lifetime contributions until retirement
 * - Retirement date with years remaining
 * 
 * Each scenario includes:
 * - Final projected value
 * - Return rate percentage with explanatory tooltip
 * - Visual indicators (icons and colors) for easy distinction
 * 
 * @component
 * @param {ProjectionRatesSummaryProps} props - Component props
 * @param {Object} props.scenarios - The three projection scenarios to display
 * 
 * @example
 * ```tsx
 * <ProjectionRatesSummary
 *   scenarios={{
 *     pessimistic: { ... },
 *     realistic: { ... },
 *     optimistic: { ... }
 *   }}
 * />
 * ```
 */
export function ProjectionRatesSummary({
  scenarios
}: ProjectionRatesSummaryProps) {
  const { settings: globalSettings } = useSettings()
  const [formattedValues, setFormattedValues] = useState({
    pessimistic: "0",
    realistic: "0",
    optimistic: "0",
    contributions: "0"
  })
  
  // State for formatted return rates (to avoid hydration mismatches)
  const [formattedRates, setFormattedRates] = useState({
    pessimistic: "0% return",
    realistic: "0% return",
    optimistic: "0% return"
  })

  // Use useEffect to format values client-side only after hydration
  useEffect(() => {
    setFormattedValues({
      pessimistic: formatCurrency(scenarios.pessimistic.finalValue, {
        locale: globalSettings.number_locale,
        currency: globalSettings.currency,
        decimals: 0
      }).formatted,
      realistic: formatCurrency(scenarios.realistic.finalValue, {
        locale: globalSettings.number_locale,
        currency: globalSettings.currency,
        decimals: 0
      }).formatted,
      optimistic: formatCurrency(scenarios.optimistic.finalValue, {
        locale: globalSettings.number_locale,
        currency: globalSettings.currency,
        decimals: 0
      }).formatted,
      contributions: formatCurrency(scenarios.realistic.totalContributions || 0, {
        locale: globalSettings.number_locale,
        currency: globalSettings.currency,
        decimals: 0
      }).formatted
    })
    
    // Format return rates client-side only to avoid hydration mismatches
    setFormattedRates({
      pessimistic: `${formatNumber(globalSettings.projection_pessimistic_rate, { 
        locale: globalSettings.number_locale,
        decimals: 1 
      }).formatted}% return`,
      realistic: `${formatNumber(globalSettings.projection_realistic_rate, { 
        locale: globalSettings.number_locale,
        decimals: 1 
      }).formatted}% return`,
      optimistic: `${formatNumber(globalSettings.projection_optimistic_rate, { 
        locale: globalSettings.number_locale,
        decimals: 1 
      }).formatted}% return`
    })
  }, [scenarios, globalSettings])

  // Get retirement date from the last data point of the realistic scenario
  const retirementDate = scenarios.realistic.dataPoints[scenarios.realistic.dataPoints.length - 1]?.date
  const yearsUntilRetirement = retirementDate ? differenceInYears(new Date(retirementDate), new Date()) : 0
  const formattedRetirementDate = retirementDate ? format(new Date(retirementDate), 'MMMM yyyy') : 'Not set'

  return (
    <Explanation>
      <ExplanationHeader>Projections</ExplanationHeader>
      <div className="mt-4 space-y-4">
        <ExplanationStats columns={3}>
          <ExplanationStat
            icon={TrendingDown}
            label="Pessimistic"
            value={formattedValues.pessimistic}
            subValue={formattedRates.pessimistic}
            tooltip="Assumes lower market returns during challenging conditions"
          />
          <ExplanationStat
            icon={ArrowRight}
            label="Realistic"
            value={formattedValues.realistic}
            subValue={formattedRates.realistic}
            tooltip="Based on historical average market returns"
          />
          <ExplanationStat
            icon={TrendingUp}
            label="Optimistic"
            value={formattedValues.optimistic}
            subValue={formattedRates.optimistic}
            tooltip="Assumes higher returns during favorable conditions"
          />
        </ExplanationStats>

        <ExplanationStats columns={2}>
          <ExplanationStat
            icon={Wallet}
            label="Total Contributions"
            value={formattedValues.contributions}
            subValue="Until retirement"
          />
          <ExplanationStat
            icon={Calendar}
            label="Retirement Date"
            value={formattedRetirementDate}
            subValue={`In ${yearsUntilRetirement} years`}
          />
        </ExplanationStats>
      </div>
    </Explanation>
  )
} 