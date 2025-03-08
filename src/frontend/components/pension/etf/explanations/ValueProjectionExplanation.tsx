"use client"

/**
 * This component follows the formatting best practices documented in:
 * docs/frontend/guides/formatting-best-practices.md
 * 
 * It uses client-side only formatting with useState and useEffect to avoid hydration mismatches.
 */

import { useState, useEffect } from "react"
import { TrendingDown, TrendingUp, ArrowRight, Wallet, Calendar, ChevronDown } from "lucide-react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatCurrency, formatNumber } from "@/frontend/lib/transforms"
import {
  ExplanationHeader,
  ExplanationStats,
  ExplanationStat,
  ExplanationAlert,
  ExplanationContent,
  ExplanationList,
  ExplanationListItem
} from "@/frontend/components/ui/explanation"
import { ProjectionScenario } from "@/frontend/types/projection"
import { format, differenceInYears } from "date-fns"
import { Button } from "@/frontend/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/components/ui/collapsible"
import { cn } from "@/lib/utils"

/**
 * Props for the ValueProjectionExplanation component
 * @interface ValueProjectionExplanationProps
 * @property {Object} scenarios - Object containing the three projection scenarios
 * @property {ProjectionScenario} scenarios.pessimistic - Pessimistic scenario with lower returns
 * @property {ProjectionScenario} scenarios.realistic - Realistic scenario based on historical averages
 * @property {ProjectionScenario} scenarios.optimistic - Optimistic scenario with higher returns
 */
interface ValueProjectionExplanationProps {
  scenarios: {
    pessimistic: ProjectionScenario
    realistic: ProjectionScenario
    optimistic: ProjectionScenario
  }
}

/**
 * ValueProjectionExplanation displays a comprehensive overview of retirement projections
 * including different scenarios (pessimistic, realistic, optimistic) and key metrics,
 * along with detailed explanations about the projection methodology.
 * 
 * This component merges the functionality of ProjectionRatesSummary and ProjectionExplanations.
 * 
 * @component
 * @param {ValueProjectionExplanationProps} props - Component props
 * @param {Object} props.scenarios - The three projection scenarios to display
 */
export function ValueProjectionExplanation({
  scenarios
}: ValueProjectionExplanationProps) {
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

  // State for collapsible section (from ProjectionExplanations)
  const [isOpen, setIsOpen] = useState(false)

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
    <div className="space-y-4">
      {/* Stats from ProjectionRatesSummary */}
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

      {/* Alert and expandable content from ProjectionExplanations */}
      <ExplanationAlert>
        These projections are estimates based on consistent return rates. 
        Actual returns will vary year to year.
      </ExplanationAlert>
      
      {/* Expandable section */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn(
          "rounded-lg transition-colors",
          isOpen && "bg-muted"
        )}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "flex w-full justify-between p-4 font-normal hover:bg-transparent",
                isOpen && "border-b border-border"
              )}
            >
              <span className="font-semibold opacity-80">
                {isOpen ? "Show Less Details" : "Show More Details"}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="p-4 space-y-4">
            <div>
              <ExplanationHeader>Calculation Method</ExplanationHeader>
              <ExplanationContent>
                <p>
                  Projections are calculated using compound interest with regular contributions. 
                  The model takes into account your current portfolio value, planned monthly 
                  contributions from the form data, and the selected return rates for each scenario.
                </p>
              </ExplanationContent>
            </div>

            <div>
              <ExplanationHeader>How to Use This Information</ExplanationHeader>
              <ExplanationList>
                <ExplanationListItem>
                  Use the realistic scenario as your baseline for planning
                </ExplanationListItem>
                <ExplanationListItem>
                  Consider the pessimistic scenario for conservative planning
                </ExplanationListItem>
                <ExplanationListItem>
                  The optimistic scenario shows potential upside but shouldn&apos;t be 
                  relied upon for primary planning
                </ExplanationListItem>
                <ExplanationListItem>
                  Regularly review and adjust your contribution strategy based on 
                  actual performance
                </ExplanationListItem>
              </ExplanationList>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  )
} 