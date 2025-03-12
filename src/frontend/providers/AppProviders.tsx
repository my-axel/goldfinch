"use client"

import { HouseholdProvider } from '@/frontend/context/HouseholdContext'
import { PensionProvider } from '@/frontend/context/pension'
import { ETFProvider } from '@/frontend/context/ETFContext'
import { SettingsProvider } from '@/frontend/context/SettingsContext'
import { Toaster } from '@/frontend/components/ui/sonner'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <HouseholdProvider>
        <ETFProvider>
          <PensionProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </PensionProvider>
        </ETFProvider>
      </HouseholdProvider>
    </SettingsProvider>
  )
} 