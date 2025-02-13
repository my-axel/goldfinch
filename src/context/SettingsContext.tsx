"use client"

import { createContext, useContext, useState, useCallback } from 'react'

interface Settings {
  currency: string
  locale: string
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    currency: 'USD',
    locale: 'en-US'
  })

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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