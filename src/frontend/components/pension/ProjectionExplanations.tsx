"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { useSettings } from "@/frontend/context/SettingsContext"
import { Alert, AlertDescription } from "@/frontend/components/ui/alert"
import { Info } from "lucide-react"

export function ProjectionExplanations() {
  const { settings } = useSettings()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Understanding Your Projections</CardTitle>
          <CardDescription>
            How we calculate your potential future wealth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Return Rate Scenarios</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Pessimistic ({settings.projection_pessimistic_rate}%):</span>{" "}
                Assumes lower market returns, representing conservative growth during challenging market conditions.
              </p>
              <p>
                <span className="font-medium text-foreground">Realistic ({settings.projection_realistic_rate}%):</span>{" "}
                Based on historical average market returns, representing a balanced growth scenario.
              </p>
              <p>
                <span className="font-medium text-foreground">Optimistic ({settings.projection_optimistic_rate}%):</span>{" "}
                Assumes higher market returns, representing strong growth during favorable market conditions.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Calculation Method</h4>
            <p className="text-sm text-muted-foreground">
              Projections are calculated using compound interest with regular contributions. 
              The model takes into account your current portfolio value, planned monthly 
              contributions, and the selected return rates for each scenario.
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These projections are estimates based on consistent return rates. 
              Actual returns will vary year to year and may be higher or lower 
              than the projected values.
            </AlertDescription>
          </Alert>

          <div>
            <h4 className="font-medium mb-2">How to Use This Information</h4>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
              <li>
                Use the realistic scenario as your baseline for planning
              </li>
              <li>
                Consider the pessimistic scenario for conservative planning
              </li>
              <li>
                The optimistic scenario shows potential upside but shouldn&apos;t be 
                relied upon for primary planning
              </li>
              <li>
                Regularly review and adjust your contribution strategy based on 
                actual performance
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 