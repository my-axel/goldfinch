"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"

export default function PensionHealthPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pension Health</h1>
          <p className="text-muted-foreground mt-2">
            Analyze your pension needs and track progress towards your retirement goals
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gap Analysis</CardTitle>
            <CardDescription>
              Calculate and visualize the difference between your needed and current pension
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 space-y-2">
              <li>Enter your current wage for baseline calculations</li>
              <li>View your pension gap with real-time updates</li>
              <li>Automatic integration with household member data</li>
              <li>Compare with your existing pension plans</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Smart Recommendations</CardTitle>
            <CardDescription>
              Get personalized suggestions to improve your pension health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 space-y-2">
              <li>Actionable steps to close your pension gap</li>
              <li>Risk level assessment</li>
              <li>Savings adjustment recommendations</li>
              <li>Investment strategy suggestions</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interactive Planning</CardTitle>
            <CardDescription>
              Explore different scenarios and their impact on your retirement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 space-y-2">
              <li>Adjust retirement age to see immediate impact</li>
              <li>Toggle between lifestyle scenarios</li>
              <li>Explore "What if" scenarios</li>
              <li>View projected timeline visualization</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <p className="text-muted-foreground text-sm">
          Coming soon: Advanced features including inflation adjustment, tax considerations, 
          and historical tracking of your pension health progress.
        </p>
      </div>
    </div>
  )
} 