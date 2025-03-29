"use client"

import { HouseholdUIProvider } from '@/frontend/context/HouseholdUIContext'
import { StatePensionUIProvider } from '@/frontend/context/StatePensionUIContext'
import { PensionProvider } from '@/frontend/context/pension'
import { ETFUIProvider } from '@/frontend/context/ETFUIContext'
import { SettingsProvider } from '@/frontend/context/SettingsContext'
import { Toaster } from '@/frontend/components/ui/sonner'
import { QueryProvider } from './QueryProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SettingsProvider>
        <HouseholdUIProvider>
          <StatePensionUIProvider>
            <ETFUIProvider>
              <PensionProvider>
                {children}
                <Toaster richColors closeButton position="top-right" />
              </PensionProvider>
            </ETFUIProvider>
          </StatePensionUIProvider>
        </HouseholdUIProvider>
      </SettingsProvider>
    </QueryProvider>
  )
} 