"use client"

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api, Settings as ApiSettings } from '@/frontend/lib/api-client'

interface Settings extends Omit<ApiSettings, 'id' | 'created_at' | 'updated_at'> {
  ui_locale: string;
  number_locale: string;
  currency: string;
}

interface SettingsState {
  data: Settings;
  isLoading: boolean;
  error: string | null;
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  ui_locale: 'en-US',
  number_locale: 'en-US',
  currency: 'USD',
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
  function loadSettingsFromStorage(): Settings | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null;
    try {
      return JSON.parse(stored) as Settings
    } catch (error) {
      console.error('Error parsing stored settings:', error)
      return null
    }
  }

  // Save settings to localStorage
  function saveSettingsToStorage(settings: Settings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  // Fetch settings from backend
  const fetchSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await api.getSettings()
      const settings: Settings = {
        ui_locale: response.ui_locale,
        number_locale: response.number_locale,
        currency: response.currency,
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
  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const updatedSettings = await api.updateSettings(newSettings)
      const settings: Settings = {
        ui_locale: updatedSettings.ui_locale,
        number_locale: updatedSettings.number_locale,
        currency: updatedSettings.currency,
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