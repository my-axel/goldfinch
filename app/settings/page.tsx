"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Label } from "@/frontend/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatNumber, formatCurrency, formatDate } from "@/frontend/lib/transforms"

export default function SettingsPage() {
  const { settings, updateSettings, isLoading, error } = useSettings()

  const handleCurrencyChange = (value: string) => {
    updateSettings({ currency: value })
  }

  const handleUILocaleChange = (value: string) => {
    updateSettings({ ui_locale: value })
  }

  const handleNumberLocaleChange = (value: string) => {
    updateSettings({ number_locale: value })
  }

  // Example values for preview
  const previewNumber = 1234567.89
  const previewDate = new Date()

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
        </CardContent>
      </Card>
    </div>
  )
}

