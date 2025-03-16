"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Label } from "@/frontend/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Currency, CURRENCY_LABELS, NumberLocale, NUMBER_LOCALE_LABELS, UILocale, UI_LOCALE_LABELS } from "@/frontend/types/enums"
import { useSettings } from "@/frontend/context/SettingsContext"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Laptop } from "lucide-react"
import { NumberFormatPreview } from "@/frontend/components/settings/number-format-preview"
import { ProjectionPreview } from "@/frontend/components/settings/projection-preview"
import { ScenarioRatesGrid } from "@/frontend/components/settings/ScenarioRatesGrid"
import { FrontendSettings } from "@/frontend/types/settings"

export default function SettingsPage() {
  const { settings, updateSettings, isLoading, error } = useSettings()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [rateErrors, setRateErrors] = useState<{[key: string]: string}>({})

  // Ensure client-side rendering for preview
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCurrencyChange = (value: string) => {
    updateSettings({ currency: value })
  }

  const handleUILocaleChange = (value: string) => {
    updateSettings({ ui_locale: value })
  }

  const handleNumberLocaleChange = (value: string) => {
    updateSettings({ number_locale: value })
  }

  const validateRateRelationships = (
    type: 'projection' | 'state_pension',
    scenario: 'pessimistic' | 'realistic' | 'optimistic',
    newValue: number
  ): boolean => {
    const prefix = type;
    const updatedValues = {
      pessimistic: scenario === 'pessimistic' ? newValue : settings[`${prefix}_pessimistic_rate` as keyof FrontendSettings],
      realistic: scenario === 'realistic' ? newValue : settings[`${prefix}_realistic_rate` as keyof FrontendSettings],
      optimistic: scenario === 'optimistic' ? newValue : settings[`${prefix}_optimistic_rate` as keyof FrontendSettings]
    };

    const errorKey = `${prefix}_${scenario}_rate`;

    if (scenario === 'pessimistic' && updatedValues.pessimistic > updatedValues.realistic) {
      setRateErrors({
        ...rateErrors,
        [errorKey]: `${type === 'projection' ? 'ETF' : 'State pension'} pessimistic rate cannot be higher than realistic rate`
      });
      return false;
    }

    if (scenario === 'realistic') {
      if (updatedValues.realistic < updatedValues.pessimistic) {
        setRateErrors({
          ...rateErrors,
          [errorKey]: `${type === 'projection' ? 'ETF' : 'State pension'} realistic rate cannot be lower than pessimistic rate`
        });
        return false;
      }
      if (updatedValues.realistic > updatedValues.optimistic) {
        setRateErrors({
          ...rateErrors,
          [errorKey]: `${type === 'projection' ? 'ETF' : 'State pension'} realistic rate cannot be higher than optimistic rate`
        });
        return false;
      }
    }

    if (scenario === 'optimistic' && updatedValues.optimistic < updatedValues.realistic) {
      setRateErrors({
        ...rateErrors,
        [errorKey]: `${type === 'projection' ? 'ETF' : 'State pension'} optimistic rate cannot be lower than realistic rate`
      });
      return false;
    }

    // Clear errors for the current type if validation passes
    if (rateErrors[errorKey]) {
      setRateErrors({
        ...rateErrors,
        [errorKey]: ''
      });
    }

    return true;
  };

  const handleRateChange = (key: keyof FrontendSettings, value: number) => {
    // Extract type and scenario from the key
    const [type, scenario] = key.split('_') as ['projection' | 'state_pension', 'pessimistic' | 'realistic' | 'optimistic'];
    
    if (key === 'inflation_rate' || validateRateRelationships(type, scenario, value)) {
      updateSettings({ [key]: value });
    }
  };



  // Replace renderPreview with NumberFormatPreview component
  const renderPreview = () => {
    if (!mounted) return null;
    return (
      <NumberFormatPreview
        locale={settings.number_locale}
        currency={settings.currency}
      />
    );
  };

  // Replace renderProjectionPreview with ProjectionPreview component
  const renderProjectionPreview = () => {
    if (!mounted) return null;
    return (
      <ProjectionPreview
        locale={settings.number_locale}
        currency={settings.currency}
        rates={settings}
      />
    )
  }



  // Render theme preview
  const renderThemePreview = () => {
    if (!mounted) return null

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div 
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              theme === 'light' ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50'
            }`}
            onClick={() => setTheme('light')}
          >
            <div className="flex items-center justify-center mb-2">
              <Sun className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-center">Light</p>
          </div>

          <div 
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              theme === 'dark' ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50'
            }`}
            onClick={() => setTheme('dark')}
          >
            <div className="flex items-center justify-center mb-2">
              <Moon className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-center">Dark</p>
          </div>

          <div 
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              theme === 'system' ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50'
            }`}
            onClick={() => setTheme('system')}
          >
            <div className="flex items-center justify-center mb-2">
              <Laptop className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-center">System</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your experience with personalized preferences and calculation parameters
          </p>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}
      
      {/* Language Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Language Settings</CardTitle>
              <CardDescription>Choose your preferred language and formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                <div className="mb-2">
                  <Label htmlFor="ui-locale">Interface Language</Label>
                  </div>
                  <Select
                    value={settings.ui_locale}
                    onValueChange={handleUILocaleChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UILocale).map((locale) => (
                        <SelectItem key={locale} value={locale}>
                          {UI_LOCALE_LABELS[locale as UILocale]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Number & Currency Format */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Number & Currency Format</CardTitle>
              <CardDescription>Configure how numbers, dates, and currency values are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <div className="mb-2">
                  <Label htmlFor="number-locale">Number & Date Format</Label>
                  </div>
                  <Select
                    value={settings.number_locale}
                    onValueChange={handleNumberLocaleChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(NumberLocale).map((locale) => (
                        <SelectItem key={locale} value={locale}>
                          {NUMBER_LOCALE_LABELS[locale as NumberLocale]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="mb-2">
                    <Label htmlFor="currency">Default Currency</Label>
                  </div>
                  <Select
                    value={settings.currency}
                    onValueChange={handleCurrencyChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Currency).map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {CURRENCY_LABELS[currency as Currency]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
              {renderPreview()}
        </div>
      </div>

      {/* Scenario Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-8">
          <ScenarioRatesGrid
            settings={settings}
            onUpdate={handleRateChange}
            isLoading={isLoading}
            rateErrors={rateErrors}
          />
        </div>
        <div className="lg:col-span-4">
          {renderProjectionPreview()}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>Choose your preferred color theme</CardDescription>
            </CardHeader>
            <CardContent>
              {renderThemePreview()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

