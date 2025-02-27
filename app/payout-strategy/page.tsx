"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"

export default function PayoutStrategyPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Strategy</h1>
          <p className="text-muted-foreground mt-2">
            Plan and optimize your retirement income distribution with smart, adaptive strategies
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Core Planning Features</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Timeline Visualization</CardTitle>
              <CardDescription>
                Visualize your retirement income distribution over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                <li>Visual timeline of different payout phases</li>
                <li>Integration with life events and milestones</li>
                <li>Pension availability markers</li>
                <li>Age-based planning recommendations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Scenario Planning</CardTitle>
              <CardDescription>
                Explore different retirement scenarios and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                <li>Market condition simulations</li>
                <li>Early/late retirement impact analysis</li>
                <li>Healthcare cost scenarios</li>
                <li>Lifestyle choice comparisons</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dynamic Withdrawal Strategies</CardTitle>
              <CardDescription>
                Optimize your withdrawal methods for maximum efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                <li>Fixed vs. variable withdrawal methods</li>
                <li>Required minimum distribution calculations</li>
                <li>Bucket strategy simulation</li>
                <li>Tax-efficient withdrawal sequencing</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Smart Guidance Features</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Adaptive Recommendations</CardTitle>
              <CardDescription>
                Receive personalized suggestions based on your situation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                <li>Market-based withdrawal adjustments</li>
                <li>Spending pattern analysis</li>
                <li>Tax optimization suggestions</li>
                <li>Regular strategy review prompts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Life Stage Guidance</CardTitle>
              <CardDescription>
                Get tailored advice for each retirement phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                <li>Pre-retirement preparation checklist</li>
                <li>Transition phase recommendations</li>
                <li>Early retirement years strategy</li>
                <li>Later retirement years adjustments</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Rebalancing</CardTitle>
              <CardDescription>
                Keep your investments aligned with your retirement needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-2">
                <li>Age-appropriate asset allocation</li>
                <li>Tax-loss harvesting opportunities</li>
                <li>Risk level adjustments</li>
                <li>Market condition-based rebalancing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-muted-foreground text-sm">
          Coming soon: Enhanced features including social security integration, legacy planning tools, 
          and geographic cost-of-living analysis.
        </p>
      </div>
    </div>
  )
} 