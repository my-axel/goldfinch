"use client"

import { createContext, useContext } from 'react'
import { useApi } from '@/hooks/useApi'

interface ETFContextType {
  isLoading: boolean
  error: string | null
}

const ETFContext = createContext<ETFContextType | undefined>(undefined)

export function ETFProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, error } = useApi()

  return (
    <ETFContext.Provider value={{ isLoading, error }}>
      {children}
    </ETFContext.Provider>
  )
}

export function useETF() {
  const context = useContext(ETFContext)
  if (!context) {
    throw new Error('useETF must be used within ETFProvider')
  }
  return context
} 