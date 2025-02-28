"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"

export default function PayoutStrategyPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Strategy</h1>
          <p className="text-muted-foreground mt-2">
            Plan and optimize your retirement income distribution with smart, adaptive strategies
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Timeline Visualization</CardTitle>
            <CardDescription>
              Visualize your retirement income distribution over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 space-y-2">
              <li className="font-bold">Visual timeline of different payout phases</li>
              <li className="text-muted-foreground">Integration with life events and milestones</li>
              <li className="font-bold">Pension availability markers</li>
              <li className="text-muted-foreground">Age-based planning recommendations</li>
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
              <li className="font-bold">Market condition simulations</li>
              <li className="font-bold">Early/late retirement impact analysis</li>
              <li className="text-muted-foreground">Healthcare cost scenarios</li>
              <li className="text-muted-foreground">Lifestyle choice comparisons</li>
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
              <li className="font-bold">Fixed vs. variable withdrawal methods</li>
              <li className="text-muted-foreground">Required minimum distribution calculations</li>
              <li className="text-muted-foreground">Bucket strategy simulation</li>
              <li className="font-bold">Tax-efficient withdrawal sequencing</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adaptive Recommendations</CardTitle>
            <CardDescription>
              Receive personalized suggestions based on your situation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 space-y-2">
              <li className="font-bold text-red-800/70">Market-based withdrawal adjustments</li>
              <li className="font-bold text-red-800/70">Spending pattern analysis</li>
              <li className="text-muted-foreground">Tax optimization suggestions</li>
              <li className="text-muted-foreground">Regular strategy review prompts</li>
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
              <li className="font-bold">Pre-retirement preparation checklist</li>
              <li className="font-bold text-red-800/70">Transition phase recommendations</li>
              <li className="text-muted-foreground">Early retirement years strategy</li>
              <li className="text-muted-foreground">Later retirement years adjustments</li>
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
              <li className="font-bold">Age-appropriate asset allocation</li>
              <li className="text-muted-foreground">Tax-loss harvesting opportunities</li>
              <li className="font-bold">Risk level adjustments</li>
              <li className="text-muted-foreground">Market condition-based rebalancing</li>
            </ul>
          </CardContent>
        </Card>
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