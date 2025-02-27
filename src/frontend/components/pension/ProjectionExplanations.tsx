"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  Explanation,
  ExplanationHeader,
  ExplanationContent,
  ExplanationAlert,
  ExplanationList,
  ExplanationListItem
} from "@/frontend/components/ui/explanation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/frontend/components/ui/collapsible"
import { Button } from "@/frontend/components/ui/button"
import { cn } from "@/lib/utils"

export function ProjectionExplanations() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Explanation>
      <div className="space-y-4">
        {/* Summary Section - Always Visible */}
        <ExplanationAlert>
          These projections are estimates based on consistent return rates. 
          Actual returns will vary year to year.
        </ExplanationAlert>

        {/* Expandable Detailed Section */}
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
    </Explanation>
  )
} 