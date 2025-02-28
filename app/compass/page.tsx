"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"

export default function CompassPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compass</h1>
          <p className="text-muted-foreground mt-2">
            Navigate your retirement journey with smart analysis and personalized guidance
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
              <li className="font-bold">Enter your current wage for baseline calculations</li>
              <li className="font-bold">View your pension gap with real-time updates</li>
              <li className="text-muted-foreground">Automatic integration with household member data</li>
              <li className="font-bold">Compare with your existing pension plans</li>
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
              <li className="font-bold text-red-800/70">Actionable steps to close your pension gap</li>
              <li className="font-bold">Risk level assessment</li>
              <li className="font-bold text-red-800/70">Savings adjustment recommendations</li>
              <li className="text-muted-foreground">Investment strategy suggestions</li>
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
              <li className="font-bold">Adjust retirement age to see immediate impact</li>
              <li className="text-muted-foreground">Toggle between lifestyle scenarios</li>
              <li className="text-muted-foreground">Explore &quot;What if&quot; scenarios</li>
              <li className="font-bold">View projected timeline visualization</li>
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