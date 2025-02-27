"use client"

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '@/frontend/lib/api-client'
import { settingsService } from '@/frontend/services/settings'
import { FrontendSettings, SettingsState, SettingsContextType } from '@/frontend/types/settings'

const defaultSettings: FrontendSettings = {
  ui_locale: 'en-US',
  number_locale: 'en-US',
  currency: 'USD',
  projection_pessimistic_rate: 4.0,
  projection_realistic_rate: 6.0,
  projection_optimistic_rate: 8.0,
  inflation_rate: 2.0,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'app_settings'

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>({
    data: loadSettingsFromStorage() || defaultSettings,
    isLoading: true,
    error: null,
  })

  // Load settings from localStorage
  function loadSettingsFromStorage(): FrontendSettings | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null;
    try {
      return JSON.parse(stored) as FrontendSettings
    } catch (error) {
      console.error('Error parsing stored settings:', error)
      return null
    }
  }

  // Save settings to localStorage
  function saveSettingsToStorage(settings: FrontendSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  // Fetch settings from backend
  const fetchSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await settingsService.getSettings()
      const settings: FrontendSettings = {
        ui_locale: response.ui_locale,
        number_locale: response.number_locale,
        currency: response.currency,
        projection_pessimistic_rate: response.projection_pessimistic_rate,
        projection_realistic_rate: response.projection_realistic_rate,
        projection_optimistic_rate: response.projection_optimistic_rate,
        inflation_rate: response.inflation_rate,
      }
      setState({ data: settings, isLoading: false, error: null })
      saveSettingsToStorage(settings)
      // Update API client locale for number parsing
      api.setLocale(settings.number_locale)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load settings'
      }))
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<FrontendSettings>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const updatedSettings = await settingsService.updateSettings(newSettings)
      const settings: FrontendSettings = {
        ui_locale: updatedSettings.ui_locale,
        number_locale: updatedSettings.number_locale,
        currency: updatedSettings.currency,
        projection_pessimistic_rate: updatedSettings.projection_pessimistic_rate,
        projection_realistic_rate: updatedSettings.projection_realistic_rate,
        projection_optimistic_rate: updatedSettings.projection_optimistic_rate,
        inflation_rate: updatedSettings.inflation_rate,
      }
      
      setState({ data: settings, isLoading: false, error: null })
      saveSettingsToStorage(settings)
      
      // Update API client locale for number parsing
      api.setLocale(settings.number_locale)
    } catch (error) {
      console.error('Error updating settings:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to update settings'
      }))
      throw error // Re-throw for UI handling
    }
  }, [])

  const value = {
    settings: state.data,
    isLoading: state.isLoading,
    error: state.error,
    updateSettings,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
} 