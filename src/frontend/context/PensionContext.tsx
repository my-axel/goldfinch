"use client"

import { createContext, useContext } from 'react'
import { useApi } from '@/frontend/hooks/useApi'

interface PensionContextType {
  isLoading: boolean
  error: string | null
}

const PensionContext = createContext<PensionContextType | undefined>(undefined)

export function PensionProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, error } = useApi()

  return (
    <PensionContext.Provider value={{ isLoading, error }}>
      {children}
    </PensionContext.Provider>
  )
}

export function usePension() {
  const context = useContext(PensionContext)
  if (!context) {
    throw new Error('usePension must be used within PensionProvider')
  }
  return context
} 