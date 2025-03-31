"use client"

import { HouseholdUIProvider } from '@/frontend/context/HouseholdUIContext'
import { StatePensionUIProvider } from '@/frontend/context/StatePensionUIContext'
import { CompanyPensionUIProvider } from '@/frontend/context/CompanyPensionUIContext'
import { InsurancePensionUIProvider } from '@/frontend/context/InsurancePensionUIContext'
import { ETFUIProvider } from '@/frontend/context/ETFUIContext'
import { SettingsProvider } from '@/frontend/context/SettingsContext'
import { QueryProvider } from './QueryProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SettingsProvider>
        <HouseholdUIProvider>
          <StatePensionUIProvider>
            <CompanyPensionUIProvider>
              <InsurancePensionUIProvider>
                <ETFUIProvider>
                  {children}
                </ETFUIProvider>
              </InsurancePensionUIProvider>
            </CompanyPensionUIProvider>
          </StatePensionUIProvider>
        </HouseholdUIProvider>
      </SettingsProvider>
    </QueryProvider>
  )
} 