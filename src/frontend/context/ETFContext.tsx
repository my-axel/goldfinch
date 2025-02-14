"use client"

import { createContext, useContext, useState, useCallback } from 'react'
import { ETF } from '@/frontend/types/etf'
import { useApi } from '@/frontend/hooks/useApi'

interface ETFContextType {
  etfs: ETF[]
  isLoading: boolean
  error: string | null
  fetchETFs: () => Promise<void>
  searchETFs: (query: string) => Promise<void>
  addETF: (etf: Omit<ETF, 'id'>) => Promise<ETF>
  updateETF: (id: string, etf: Partial<ETF>) => Promise<ETF>
  deleteETF: (id: string) => Promise<void>
}

const ETFContext = createContext<ETFContextType | undefined>(undefined)

export function ETFProvider({ children }: { children: React.ReactNode }) {
  const [etfs, setETFs] = useState<ETF[]>([])
  const { isLoading, error, apiCall } = useApi()

  const fetchETFs = useCallback(async () => {
    const data = await apiCall<ETF[]>('/api/v1/etf')
    setETFs(data)
  }, [apiCall])

  const searchETFs = useCallback(async (query: string) => {
    const data = await apiCall<ETF[]>(`/api/v1/etf?query=${encodeURIComponent(query)}`)
    setETFs(data)
  }, [apiCall])

  const addETF = useCallback(async (etf: Omit<ETF, 'id'>) => {
    const newETF = await apiCall<ETF>('/etf', 'POST', etf)
    setETFs(prev => [...prev, newETF])
    return newETF
  }, [apiCall])

  const updateETF = useCallback(async (id: string, etf: Partial<ETF>) => {
    const updatedETF = await apiCall<ETF>(`/etf/${id}`, 'PUT', etf)
    setETFs(prev => prev.map(e => e.id === id ? updatedETF : e))
    return updatedETF
  }, [apiCall])

  const deleteETF = useCallback(async (id: string) => {
    await apiCall(`/etf/${id}`, 'DELETE')
    setETFs(prev => prev.filter(e => e.id !== id))
  }, [apiCall])

  return (
    <ETFContext.Provider 
      value={{ 
        etfs, 
        isLoading, 
        error, 
        fetchETFs,
        searchETFs,
        addETF, 
        updateETF, 
        deleteETF 
      }}
    >
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