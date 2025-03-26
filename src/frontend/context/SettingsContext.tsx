"use client"

import { createContext, useContext, useCallback, useEffect } from 'react'
import { FrontendSettings, SettingsContextType } from '@/frontend/types/settings'
import { useSettings as useSettingsQuery, useUpdateSettings } from '@/frontend/hooks/useSettings'

const defaultSettings: FrontendSettings = {
  ui_locale: 'en-US',
  number_locale: 'en-US',
  currency: 'USD',
  projection_pessimistic_rate: 4.0,
  projection_realistic_rate: 6.0,
  projection_optimistic_rate: 8.0,
  state_pension_pessimistic_rate: 1.0,
  state_pension_realistic_rate: 1.5,
  state_pension_optimistic_rate: 2.0,
  inflation_rate: 2.0,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'app_settings'

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Load settings from localStorage for initial data
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

  // Use React Query hooks
  const { 
    data: querySettings, 
    isLoading: isQueryLoading, 
    error: queryError 
  } = useSettingsQuery({
    initialData: loadSettingsFromStorage() || defaultSettings,
  })
  
  const updateSettingsMutation = useUpdateSettings()

  // Update localStorage when settings change
  useEffect(() => {
    if (querySettings) {
      saveSettingsToStorage(querySettings)
    }
  }, [querySettings])

  // Update settings - maintains the same API as before
  const updateSettings = useCallback(async (newSettings: Partial<FrontendSettings>) => {
    try {
      await updateSettingsMutation.mutateAsync(newSettings)
      return
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error // Re-throw for UI handling
    }
  }, [updateSettingsMutation])

  // Create the context value with the same API as before
  const value: SettingsContextType = {
    settings: querySettings || defaultSettings,
    isLoading: isQueryLoading,
    error: queryError ? 'Failed to load settings' : null,
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