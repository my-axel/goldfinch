"use client"

import { useSettings } from "@/frontend/context/SettingsContext"
import { formatNumber } from "@/frontend/lib/transforms"
import {
  Explanation,
  ExplanationHeader,
  ExplanationContent,
  ExplanationAlert,
  ExplanationList,
  ExplanationListItem
} from "@/frontend/components/ui/explanation"

export function ProjectionExplanations() {
  const { settings } = useSettings()

  return (
    <Explanation>
      <div>
        <ExplanationHeader>Return Rate Scenarios</ExplanationHeader>
        <ExplanationContent>
          <p>
            <span className="font-semibold">Pessimistic ({formatNumber(settings.projection_pessimistic_rate, { decimals: 2 }).formatted}%):</span>{" "}
            Assumes lower market returns, representing conservative growth during challenging market conditions.
          </p>
          <p>
            <span className="font-semibold">Realistic ({formatNumber(settings.projection_realistic_rate, { decimals: 2 }).formatted}%):</span>{" "}
            Based on historical average market returns, representing a balanced growth scenario.
          </p>
          <p>
            <span className="font-semibold">Optimistic ({formatNumber(settings.projection_optimistic_rate, { decimals: 2 }).formatted}%):</span>{" "}
            Assumes higher market returns, representing strong growth during favorable market conditions.
          </p>
        </ExplanationContent>
      </div>

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

      <ExplanationAlert>
        These projections are estimates based on consistent return rates. 
        Actual returns will vary year to year and may be higher or lower 
        than the projected values.
      </ExplanationAlert>

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
    </Explanation>
  )
} 