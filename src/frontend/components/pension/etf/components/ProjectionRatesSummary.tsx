"use client"

import { TrendingDown, TrendingUp, ArrowRight, Wallet, Calendar } from "lucide-react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency, formatNumber } from "@/frontend/lib/transforms"
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

  /**
   * Formats a number value as currency according to user settings
   * @param {number} value - The number to format
   * @returns {string} Formatted currency string
   */
  const formatValue = (value: number) => {
    return formatCurrency(value, {
      locale: globalSettings.number_locale,
      currency: globalSettings.currency,
      decimals: 0
    }).formatted
  }

  // Calculate total contributions from the realistic scenario
  const totalContributions = scenarios.realistic.totalContributions || 0
  
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
            value={formatValue(scenarios.pessimistic.finalValue)}
            subValue={`${formatNumber(globalSettings.projection_pessimistic_rate, { decimals: 1 }).formatted}% return`}
            tooltip="Assumes lower market returns during challenging conditions"
          />
          <ExplanationStat
            icon={ArrowRight}
            label="Realistic"
            value={formatValue(scenarios.realistic.finalValue)}
            subValue={`${formatNumber(globalSettings.projection_realistic_rate, { decimals: 1 }).formatted}% return`}
            tooltip="Based on historical average market returns"
          />
          <ExplanationStat
            icon={TrendingUp}
            label="Optimistic"
            value={formatValue(scenarios.optimistic.finalValue)}
            subValue={`${formatNumber(globalSettings.projection_optimistic_rate, { decimals: 1 }).formatted}% return`}
            tooltip="Assumes higher returns during favorable conditions"
          />
        </ExplanationStats>

        <ExplanationStats columns={2}>
          <ExplanationStat
            icon={Wallet}
            label="Total Contributions"
            value={formatValue(totalContributions)}
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