"use client"

import { RateInput } from "@/frontend/components/ui/rate-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Label } from "@/frontend/components/ui/label"
import { FrontendSettings } from "@/frontend/types/settings"
import { TrendingDown, ArrowRight, TrendingUp } from "lucide-react"
import { Separator } from "@/frontend/components/ui/separator"

interface ScenarioRatesGridProps {
  settings: FrontendSettings;
  onUpdate: (key: keyof FrontendSettings, value: number) => void;
  isLoading: boolean;
  rateErrors: { [key: string]: string };
}

export function ScenarioRatesGrid({ settings, onUpdate, isLoading, rateErrors }: ScenarioRatesGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Rate Scenarios</CardTitle>
        <CardDescription>Configure annual growth rates for different pension types</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Inflation Rate (standalone) */}
        <div className="grid grid-cols-4 gap-6">
          <div className="flex items-center">
            <Label className="text-base font-semibold">Inflation Rate</Label>
          </div>
          <div>
            <RateInput
              label="Inflation Rate"
              value={settings.inflation_rate}
              onChange={(value) => onUpdate('inflation_rate', value)}
              min={0}
              max={15}
              step={0.1}
              disabled={isLoading}
              error={rateErrors.inflation_rate}
              hideLabel
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Scenario Rates Grid */}
        <div className="space-y-6">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-6">
            <div className="col-span-1"></div>
            <div className="col-span-3 grid grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <TrendingDown className="h-5 w-5 mb-2 text-yellow-500" />
                <span className="text-sm font-medium">Pessimistic</span>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight className="h-5 w-5 mb-2 text-blue-500" />
                <span className="text-sm font-medium">Realistic</span>
              </div>
              <div className="flex flex-col items-center">
                <TrendingUp className="h-5 w-5 mb-2 text-green-500" />
                <span className="text-sm font-medium">Optimistic</span>
              </div>
            </div>
          </div>
          
          {/* ETF Pension row */}
          <div className="grid grid-cols-4 gap-6">
            <div className="flex items-center">
              <Label className="text-base">ETF Pension</Label>
            </div>
            <div className="col-span-3 grid grid-cols-3 gap-6">
              <RateInput
                label="ETF Pension Pessimistic Rate"
                value={settings.projection_pessimistic_rate}
                onChange={(value) => onUpdate('projection_pessimistic_rate', value)}
                min={0}
                max={15}
                step={0.1}
                disabled={isLoading}
                error={rateErrors.projection_pessimistic_rate}
                hideLabel
              />
              <RateInput
                label="ETF Pension Realistic Rate"
                value={settings.projection_realistic_rate}
                onChange={(value) => onUpdate('projection_realistic_rate', value)}
                min={0}
                max={15}
                step={0.1}
                disabled={isLoading}
                error={rateErrors.projection_realistic_rate}
                hideLabel
              />
              <RateInput
                label="ETF Pension Optimistic Rate"
                value={settings.projection_optimistic_rate}
                onChange={(value) => onUpdate('projection_optimistic_rate', value)}
                min={0}
                max={15}
                step={0.1}
                disabled={isLoading}
                error={rateErrors.projection_optimistic_rate}
                hideLabel
              />
            </div>
          </div>
          
          {/* State Pension row */}
          <div className="grid grid-cols-4 gap-6">
            <div className="flex items-center">
              <Label className="text-base">State Pension</Label>
            </div>
            <div className="col-span-3 grid grid-cols-3 gap-6">
              <RateInput
                label="State Pension Pessimistic Rate"
                value={settings.state_pension_pessimistic_rate}
                onChange={(value) => onUpdate('state_pension_pessimistic_rate', value)}
                min={0}
                max={15}
                step={0.1}
                disabled={isLoading}
                error={rateErrors.state_pension_pessimistic_rate}
                hideLabel
              />
              <RateInput
                label="State Pension Realistic Rate"
                value={settings.state_pension_realistic_rate}
                onChange={(value) => onUpdate('state_pension_realistic_rate', value)}
                min={0}
                max={15}
                step={0.1}
                disabled={isLoading}
                error={rateErrors.state_pension_realistic_rate}
                hideLabel
              />
              <RateInput
                label="State Pension Optimistic Rate"
                value={settings.state_pension_optimistic_rate}
                onChange={(value) => onUpdate('state_pension_optimistic_rate', value)}
                min={0}
                max={15}
                step={0.1}
                disabled={isLoading}
                error={rateErrors.state_pension_optimistic_rate}
                hideLabel
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 