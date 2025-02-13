"use client"

import { HouseholdProvider } from '@/context/HouseholdContext'
import { PensionProvider } from '@/context/PensionContext'
import { ETFProvider } from '@/context/ETFContext'
import { SettingsProvider } from '@/context/SettingsContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <HouseholdProvider>
        <PensionProvider>
          <ETFProvider>
            {children}
          </ETFProvider>
        </PensionProvider>
      </HouseholdProvider>
    </SettingsProvider>
  )
} 