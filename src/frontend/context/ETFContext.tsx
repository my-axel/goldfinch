"use client"

import { createContext, useContext, useState, useCallback } from 'react'
import { ETF, ETFUpdateStatus, ETFMetrics } from '@/frontend/types/etf'
import { useApi } from '@/frontend/hooks/useApi'
import { 
  getETFApiRoute, 
  getETFByIdRoute, 
  getETFSearchRoute, 
  getETFUpdateRoute, 
  getETFStatusRoute, 
  getETFMetricsRoute 
} from '@/frontend/lib/routes/api/etf'

interface ETFContextType {
  etfs: ETF[]
  isLoading: boolean
  error: string | null
  fetchETFs: () => Promise<void>
  searchETFs: (query: string) => Promise<void>
  addETF: (etf: Omit<ETF, 'id'>) => Promise<ETF>
  updateETF: (id: string, etf: Partial<ETF>) => Promise<ETF>
  deleteETF: (id: string) => Promise<void>
  updateETFData: (id: string, type: string) => Promise<void>
  getETFStatus: (id: string) => Promise<ETFUpdateStatus[]>
  getETFMetrics: (id: string) => Promise<ETFMetrics>
}

const ETFContext = createContext<ETFContextType | undefined>(undefined)

export function ETFProvider({ children }: { children: React.ReactNode }) {
  const [etfs, setETFs] = useState<ETF[]>([])
  const { isLoading, error, apiCall } = useApi()

  const fetchETFs = useCallback(async () => {
    const data = await apiCall<ETF[]>(getETFApiRoute())
    setETFs(data)
  }, [apiCall])

  const searchETFs = useCallback(async (query: string) => {
    const data = await apiCall<ETF[]>(getETFSearchRoute(query))
    setETFs(data)
  }, [apiCall])

  const addETF = useCallback(async (etf: Omit<ETF, 'id'>) => {
    const newETF = await apiCall<ETF>(getETFApiRoute(), 'POST', etf)
    setETFs(prev => [...prev, newETF])
    return newETF
  }, [apiCall])

  const updateETF = useCallback(async (id: string, etf: Partial<ETF>) => {
    const updatedETF = await apiCall<ETF>(getETFByIdRoute(id), 'PUT', etf)
    setETFs(prev => prev.map(e => e.id === id ? updatedETF : e))
    return updatedETF
  }, [apiCall])

  const deleteETF = useCallback(async (id: string) => {
    await apiCall(getETFByIdRoute(id), 'DELETE')
    setETFs(prev => prev.filter(e => e.id !== id))
  }, [apiCall])

  const updateETFData = useCallback(async (id: string, type: string) => {
    try {
      await apiCall(getETFUpdateRoute(id, type), 'POST')
    } catch (error) {
      console.error('Failed to update ETF data:', error)
      throw error
    }
  }, [apiCall])

  const getETFStatus = useCallback(async (id: string) => {
    return await apiCall<ETFUpdateStatus[]>(getETFStatusRoute(id), 'GET')
  }, [apiCall])

  const getETFMetrics = useCallback(async (id: string) => {
    return await apiCall<ETFMetrics>(getETFMetricsRoute(id), 'GET')
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
        deleteETF,
        updateETFData,
        getETFStatus,
        getETFMetrics
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