"use client"

import { Toggle } from "@/components/ui/toggle"
import { Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-0">
       <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Complete overview of your retirement journey - past achievements and future possibilities
          </p>
        </div>
        <Toggle aria-label="Toggle view" className="flex items-center gap-2 data-[state=on]:bg-primary">
          <Users className="h-4 w-4" />
          <span className="text-sm">Household View</span>
        </Toggle>
      </div>
      
      {/* Main content container */}
      <div className="grid grid-cols-1 md:grid-cols-13 gap-6">
        {/* Left Column - Current Position & History */}
        <div className="md:col-span-6 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Current Position & History</h2>
          
          {/* Key Metrics */}
          <div className="grid gap-4 grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total Portfolio Value</CardTitle>
                <CardDescription>Quick overview of your current position</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2 text-sm">
                  <li>Total value across all pension plans</li>
                  <li>Month/Year-over-Year growth rates</li>
                  <li>Distribution pie chart by pension type</li>
                  <li>Sparkline showing recent trend</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Contributions</CardTitle>
                <CardDescription>Your investment commitment</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2 text-sm">
                  <li>Total contributions to date</li>
                  <li>This year&apos;s contributions</li>
                  <li>Average monthly contribution</li>
                  <li>Contribution streak/consistency</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Returns</CardTitle>
                <CardDescription>What your money has earned</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2 text-sm">
                  <li>Total returns earned</li>
                  <li>Return percentage (XIRR)</li>
                  <li>Best performing plan</li>
                  <li>This year&apos;s earnings</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2 text-sm">
                  <li>Record new contribution</li>
                  <li>Update plan values</li>
                  <li>Run health check</li>
                  <li>View recent changes</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Historical Charts */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contributions vs Returns</CardTitle>
                <CardDescription>Growth breakdown over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ul className="list-disc pl-4 space-y-2">
                  <li>Stacked area chart showing:</li>
                  <ul className="list-circle pl-4 space-y-1">
                    <li>Total contributions (bottom)</li>
                    <li>Market returns (top)</li>
                    <li>Monthly/yearly toggle</li>
                  </ul>
                  <li>Hover for detailed values</li>
                  <li>Highlight significant events</li>
                  <li>Show contribution patterns</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Performance Comparison</CardTitle>
                <CardDescription>How each plan has performed</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ul className="list-disc pl-4 space-y-2">
                  <li>Multi-line chart showing:</li>
                  <ul className="list-circle pl-4 space-y-1">
                    <li>Individual plan growth</li>
                    <li>Toggle absolute/percentage view</li>
                    <li>Plan type grouping</li>
                  </ul>
                  <li>Highlight specific plans</li>
                  <li>Performance metrics table</li>
                  <li>Risk/return comparison</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Middle Column - Today - Only visible on md and up */}
        <div className="hidden md:block md:col-span-1 text-center relative h-full">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider h-10 flex items-center justify-center">Today</h2>
          <div className="h-full flex justify-center mt-4">
            <div className="w-[1px] bg-border h-full"></div>
          </div>
        </div>

        {/* Right Column - Future Projections */}
        <div className="md:col-span-6 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-right">Future Projections</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Retirement Goal Progress</CardTitle>
                <CardDescription>Track your journey to retirement</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Visual progress gauge showing:</li>
                  <ul className="list-circle pl-4 space-y-1">
                    <li>Current vs target amount</li>
                    <li>Projected completion date</li>
                    <li>Monthly target to stay on track</li>
                  </ul>
                  <li>Integration with Pension Health</li>
                  <li>Adjustable goal settings</li>
                  <li>Quick action recommendations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scenario Analysis</CardTitle>
                <CardDescription>Explore possible futures</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Area chart showing scenarios:</li>
                  <ul className="list-circle pl-4 space-y-1">
                    <li>Conservative (lower bound)</li>
                    <li>Expected (middle path)</li>
                    <li>Optimistic (upper bound)</li>
                  </ul>
                  <li>Adjustable assumptions</li>
                  <li>Risk factor highlighting</li>
                  <li>Integration with Payout Strategy</li>
                </ul>
              </CardContent>
            </Card>

            {/* Additional Insights */}
            <div className="grid gap-4 grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Action Items</CardTitle>
                  <CardDescription>Improve your outlook</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-4 space-y-2 text-sm">
                    <li>Personalized recommendations</li>
                    <li>Quick wins identification</li>
                    <li>Risk mitigation steps</li>
                    <li>Links to relevant tools</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Context</CardTitle>
                  <CardDescription>External factors to consider</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-4 space-y-2 text-sm">
                    <li>Current market conditions</li>
                    <li>Interest rate impact</li>
                    <li>Inflation considerations</li>
                    <li>Economic indicators</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
