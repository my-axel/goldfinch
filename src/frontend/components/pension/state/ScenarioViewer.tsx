"use client"

import { useEffect, useState } from "react"
import { useSettings } from "@/frontend/context/SettingsContext"
import { StatePensionScenario } from "@/frontend/types/pension"
import { TrendingDown, ArrowRight, TrendingUp } from "lucide-react"
import { formatCurrency, formatNumber } from "@/frontend/lib/transforms"
import {
  ExplanationStats,
  ExplanationStat,
  ExplanationList,
  ExplanationListItem,
  ExplanationHeader,
  ExplanationContent
} from "@/frontend/components/ui/explanation"
import { Button } from "@/frontend/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useStatePensionScenarios } from "@/frontend/hooks/pension/useStatePensions"
import { Alert, AlertDescription } from "@/frontend/components/ui/alert"
import { Skeleton } from "@/frontend/components/ui/skeleton"

interface ScenarioViewerProps {
  pensionId: number
}

export function ScenarioViewer({ pensionId }: ScenarioViewerProps) {
  const { settings } = useSettings()
  const { data: scenariosData, isLoading, error } = useStatePensionScenarios(pensionId)
  const [isOpen, setIsOpen] = useState(false)
  
  const [formattedValues, setFormattedValues] = useState({
    planned: {
      pessimistic: {
        monthlyAmount: "0",
        annualAmount: "0",
        growthRate: "0%"
      },
      realistic: {
        monthlyAmount: "0",
        annualAmount: "0",
        growthRate: "0%"
      },
      optimistic: {
        monthlyAmount: "0",
        annualAmount: "0",
        growthRate: "0%"
      },
      retirementAge: 0,
      yearsToRetirement: 0
    },
    possible: {
      pessimistic: {
        monthlyAmount: "0",
        annualAmount: "0",
        growthRate: "0%"
      },
      realistic: {
        monthlyAmount: "0",
        annualAmount: "0",
        growthRate: "0%"
      },
      optimistic: {
        monthlyAmount: "0",
        annualAmount: "0",
        growthRate: "0%"
      },
      retirementAge: 0,
      yearsToRetirement: 0
    }
  })

  // Format values when data changes
  useEffect(() => {
    if (!scenariosData || 
        !scenariosData.planned || 
        !scenariosData.possible || 
        Object.keys(scenariosData.planned).length === 0 || 
        Object.keys(scenariosData.possible).length === 0) {
      return;
    }

    // Format planned scenario values
    const formatScenario = (scenario: StatePensionScenario) => ({
      monthlyAmount: formatCurrency(scenario.monthly_amount, {
        locale: settings.number_locale, 
        currency: settings.currency,
        decimals: 0
      }).formatted,
      annualAmount: formatCurrency(scenario.annual_amount, {
        locale: settings.number_locale, 
        currency: settings.currency,
        decimals: 0
      }).formatted,
      growthRate: `${formatNumber(scenario.growth_rate, {
        locale: settings.number_locale,
        decimals: 1
      }).formatted}%`
    })

    // Check if all the required scenarios exist
    if (scenariosData.planned.pessimistic && 
        scenariosData.planned.realistic && 
        scenariosData.planned.optimistic &&
        scenariosData.possible.pessimistic && 
        scenariosData.possible.realistic && 
        scenariosData.possible.optimistic) {
      
      setFormattedValues({
        planned: {
          pessimistic: formatScenario(scenariosData.planned.pessimistic),
          realistic: formatScenario(scenariosData.planned.realistic),
          optimistic: formatScenario(scenariosData.planned.optimistic),
          retirementAge: scenariosData.planned.realistic.retirement_age,
          yearsToRetirement: scenariosData.planned.realistic.years_to_retirement
        },
        possible: {
          pessimistic: formatScenario(scenariosData.possible.pessimistic),
          realistic: formatScenario(scenariosData.possible.realistic),
          optimistic: formatScenario(scenariosData.possible.optimistic),
          retirementAge: scenariosData.possible.realistic.retirement_age,
          yearsToRetirement: scenariosData.possible.realistic.years_to_retirement
        }
      })
    }
  }, [scenariosData, settings])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Unable to load pension projections. Please try again later.
        </AlertDescription>
      </Alert>
    )
  }
  
  // No statements state - check if scenarios data exists but is empty
  if (!scenariosData || Object.keys(scenariosData.planned).length === 0) {
    return (
      <Alert>
        <AlertDescription>
          There are currently no statements with which scenarios could be calculated. Please add at least one pension statement to see projections.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Planned Retirement Age Scenarios */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Planned Retirement Age ({formattedValues.planned.retirementAge})</h3>
        <p className="text-sm text-muted-foreground">
          Projected benefits if you retire at your planned retirement age in {formattedValues.planned.yearsToRetirement} years.
        </p>
        
        <ExplanationStats columns={3}>
          <ExplanationStat
            icon={TrendingDown}
            label="Pessimistic"
            value={formattedValues.planned.pessimistic.monthlyAmount}
            subValue={formattedValues.planned.pessimistic.growthRate}
            tooltip="Lower growth rate scenario"
          />
          <ExplanationStat
            icon={ArrowRight}
            label="Realistic"
            value={formattedValues.planned.realistic.monthlyAmount}
            subValue={formattedValues.planned.realistic.growthRate}
            tooltip="Expected growth rate scenario"
          />
          <ExplanationStat
            icon={TrendingUp}
            label="Optimistic"
            value={formattedValues.planned.optimistic.monthlyAmount}
            subValue={formattedValues.planned.optimistic.growthRate}
            tooltip="Higher growth rate scenario"
          />
        </ExplanationStats>
        
        <p className="text-sm text-muted-foreground mt-2">
          Annual pension amounts: {formattedValues.planned.pessimistic.annualAmount} (pessimistic), {formattedValues.planned.realistic.annualAmount} (realistic), {formattedValues.planned.optimistic.annualAmount} (optimistic)
        </p>
      </div>
      
      {/* Alternative Retirement Age Scenarios */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-semibold">Alternative Retirement Age ({formattedValues.possible.retirementAge})</h3>
        <p className="text-sm text-muted-foreground">
          Projected benefits if you delay retirement to age {formattedValues.possible.retirementAge} (in {formattedValues.possible.yearsToRetirement} years).
        </p>
        
        <ExplanationStats columns={3}>
          <ExplanationStat
            icon={TrendingDown}
            label="Pessimistic"
            value={formattedValues.possible.pessimistic.monthlyAmount}
            subValue={formattedValues.possible.pessimistic.growthRate}
            tooltip="Lower growth rate scenario"
          />
          <ExplanationStat
            icon={ArrowRight}
            label="Realistic"
            value={formattedValues.possible.realistic.monthlyAmount}
            subValue={formattedValues.possible.realistic.growthRate}
            tooltip="Expected growth rate scenario"
          />
          <ExplanationStat
            icon={TrendingUp}
            label="Optimistic"
            value={formattedValues.possible.optimistic.monthlyAmount}
            subValue={formattedValues.possible.optimistic.growthRate}
            tooltip="Higher growth rate scenario"
          />
        </ExplanationStats>
        
        <p className="text-sm text-muted-foreground mt-2">
          Annual pension amounts: {formattedValues.possible.pessimistic.annualAmount} (pessimistic), {formattedValues.possible.realistic.annualAmount} (realistic), {formattedValues.possible.optimistic.annualAmount} (optimistic)
        </p>
      </div>

        {/* Expandable details section */}
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
                <ArrowRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="p-4 space-y-4">
              <div>
                <ExplanationHeader>Understanding Growth Rates</ExplanationHeader>
                <ExplanationContent>
                  <p>
                    The growth rates shown represent the annual adjustment to your state pension
                    benefits based on various economic factors. These include inflation adjustments,
                    wage growth, and policy-based increases to the state pension.
                  </p>
                </ExplanationContent>
              </div>

              <div>
                <ExplanationHeader>Benefits of Delayed Retirement</ExplanationHeader>
                <ExplanationList>
                  <ExplanationListItem>
                    Higher monthly and annual pension payments
                  </ExplanationListItem>
                  <ExplanationListItem>
                    Additional years of contributions increasing your benefit base
                  </ExplanationListItem>
                  <ExplanationListItem>
                    Potential bonus credits for delaying retirement past standard age
                  </ExplanationListItem>
                </ExplanationList>
              </div>
              
              <div>
                <ExplanationHeader>Considerations</ExplanationHeader>
                <ExplanationList>
                  <ExplanationListItem>
                    Your state pension will be adjusted annually based on the Triple Lock or similar policy
                  </ExplanationListItem>
                  <ExplanationListItem>
                    Projections assume you continue to qualify for full benefits until retirement
                  </ExplanationListItem>
                  <ExplanationListItem>
                    Review your state pension statements regularly for the most current information
                  </ExplanationListItem>
                </ExplanationList>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
    </div>
  )
} 