"use client"

import { HouseholdProvider } from '@/frontend/context/HouseholdContext'
import { PensionProvider } from '@/frontend/context/PensionContext'
import { ETFProvider } from '@/frontend/context/ETFContext'
import { SettingsProvider } from '@/frontend/context/SettingsContext'

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