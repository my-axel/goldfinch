"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Label } from "@/frontend/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatNumber, formatCurrency, formatDate } from "@/frontend/lib/transforms"
import { Slider } from "@/frontend/components/ui/slider"
import { Separator } from "@/frontend/components/ui/separator"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const { settings, updateSettings, isLoading, error } = useSettings()
  const [mounted, setMounted] = useState(false)
  const [sliderValues, setSliderValues] = useState({
    pessimistic: 0,
    realistic: 0,
    optimistic: 0
  })

  // Ensure client-side rendering for preview
  useEffect(() => {
    setMounted(true)
    // Initialize slider values after mounting
    setSliderValues({
      pessimistic: getRate(settings.projection_pessimistic_rate),
      realistic: getRate(settings.projection_realistic_rate),
      optimistic: getRate(settings.projection_optimistic_rate)
    })
  }, [settings])

  const handleCurrencyChange = (value: string) => {
    updateSettings({ currency: value })
  }

  const handleUILocaleChange = (value: string) => {
    updateSettings({ ui_locale: value })
  }

  const handleNumberLocaleChange = (value: string) => {
    updateSettings({ number_locale: value })
  }

  const handleProjectionRateChange = (type: 'pessimistic' | 'realistic' | 'optimistic', value: number[]) => {
    const rateKey = `projection_${type}_rate` as const
    setSliderValues(prev => ({ ...prev, [type]: value[0] }))
    updateSettings({ [rateKey]: value[0] })
  }

  // Ensure rates are numbers
  const getRate = (rate: number | undefined) => Number(rate ?? 0)

  // Example values for preview
  const previewNumber = 1234567.89
  const previewDate = new Date("2024-02-23") // Use a fixed date to avoid hydration issues
  const previewProjection = {
    currentValue: 100000,
    monthlyContribution: 1000,
    yearsToRetirement: 30
  }

  // Render preview content only after client-side hydration
  const renderPreview = () => {
    if (!mounted) return null

    return (
      <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
        <h4 className="font-medium mb-3">Preview</h4>
        <div className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground mr-2">Number:</span>
            {formatNumber(previewNumber, { locale: settings.number_locale }).formatted}
          </div>
          <div>
            <span className="text-muted-foreground mr-2">Currency:</span>
            {formatCurrency(previewNumber, {
              locale: settings.number_locale,
              currency: settings.currency
            }).formatted}
          </div>
          <div>
            <span className="text-muted-foreground mr-2">Date:</span>
            {formatDate(previewDate, { locale: settings.number_locale }).formatted}
          </div>
        </div>
      </div>
    )
  }

  // Render projection preview content only after client-side hydration
  const renderProjectionPreview = () => {
    if (!mounted) return null

    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3">Example Portfolio</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Current Value:</span>
              <div className="font-medium">
                {formatCurrency(previewProjection.currentValue, {
                  locale: settings.number_locale,
                  currency: settings.currency
                }).formatted}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Monthly Contribution:</span>
              <div className="font-medium">
                {formatCurrency(previewProjection.monthlyContribution, {
                  locale: settings.number_locale,
                  currency: settings.currency
                }).formatted}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Time Horizon:</span>
              <div className="font-medium">{previewProjection.yearsToRetirement} years</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-muted-foreground">Pessimistic Scenario:</span>
            <div className="font-medium">
              {formatCurrency(calculateProjection(previewProjection, sliderValues.pessimistic), {
                locale: settings.number_locale,
                currency: settings.currency
              }).formatted}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Realistic Scenario:</span>
            <div className="font-medium">
              {formatCurrency(calculateProjection(previewProjection, sliderValues.realistic), {
                locale: settings.number_locale,
                currency: settings.currency
              }).formatted}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Optimistic Scenario:</span>
            <div className="font-medium">
              {formatCurrency(calculateProjection(previewProjection, sliderValues.optimistic), {
                locale: settings.number_locale,
                currency: settings.currency
              }).formatted}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Only render sliders after client-side hydration
  const renderSliders = () => {
    if (!mounted) return null

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Pessimistic Scenario Return Rate</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[sliderValues.pessimistic]}
              onValueChange={(value) => handleProjectionRateChange('pessimistic', value)}
              min={0}
              max={15}
              step={0.1}
              className="flex-1"
              disabled={isLoading}
            />
            <span className="w-16 text-right">
              {sliderValues.pessimistic.toFixed(1)}%
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label>Realistic Scenario Return Rate</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[sliderValues.realistic]}
              onValueChange={(value) => handleProjectionRateChange('realistic', value)}
              min={0}
              max={15}
              step={0.1}
              className="flex-1"
              disabled={isLoading}
            />
            <span className="w-16 text-right">
              {sliderValues.realistic.toFixed(1)}%
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label>Optimistic Scenario Return Rate</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[sliderValues.optimistic]}
              onValueChange={(value) => handleProjectionRateChange('optimistic', value)}
              min={0}
              max={15}
              step={0.1}
              className="flex-1"
              disabled={isLoading}
            />
            <span className="w-16 text-right">
              {sliderValues.optimistic.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your app preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="ui-locale">Interface Language</Label>
              <Select
                value={settings.ui_locale}
                onValueChange={handleUILocaleChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="de-DE">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="number-locale">Number & Date Format</Label>
              <Select
                value={settings.number_locale}
                onValueChange={handleNumberLocaleChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">123,456.78 | 02/23/2024</SelectItem>
                  <SelectItem value="en-GB">123,456.78 | 23/02/2024</SelectItem>
                  <SelectItem value="de-DE">123.456,78 | 23.02.2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                value={settings.currency}
                onValueChange={handleCurrencyChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {renderPreview()}
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Left column (8) - Form elements */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Investment Projections</CardTitle>
              <CardDescription>Configure return rate scenarios for investment projections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderSliders()}
            </CardContent>
          </Card>
        </div>

        {/* Right column (4) - Preview and help */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Example projection based on current rates</CardDescription>
            </CardHeader>
            <CardContent>
              {renderProjectionPreview()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate projection (simplified for preview)
interface ProjectionParams {
  currentValue: number
  monthlyContribution: number
  yearsToRetirement: number
}

function calculateProjection(
  { currentValue, monthlyContribution, yearsToRetirement }: ProjectionParams,
  annualRate: number
): number {
  const monthlyRate = annualRate / 100 / 12
  const months = yearsToRetirement * 12
  
  // Future value of current principal
  const futureValue = currentValue * Math.pow(1 + monthlyRate, months)
  
  // Future value of monthly contributions
  const contributionValue = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  
  return futureValue + contributionValue
}

