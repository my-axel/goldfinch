"use client"

import { createContext, useContext, useState, useCallback } from 'react'
import { ETF, ETFUpdateStatus, ETFMetrics } from '@/frontend/types/etf'
import { useApi } from '@/frontend/hooks/useApi'
import { toast } from 'sonner'

interface ETFContextType {
  etfs: ETF[]
  isLoading: boolean
  error: string | null
  fetchETFs: () => Promise<void>
  searchETFs: (query: string) => Promise<void>
  addETF: (etf: Omit<ETF, 'id'>) => Promise<ETF>
  updateETF: (id: string, etf: Partial<ETF>) => Promise<ETF>
  deleteETF: (id: string) => Promise<void>
  triggerUpdate: (id: string, type: 'full' | 'prices_only' | 'prices_refresh') => Promise<void>
  getUpdateStatus: (id: string) => Promise<ETFUpdateStatus[]>
  getMetrics: (id: string) => Promise<ETFMetrics>
}

const ETFContext = createContext<ETFContextType | undefined>(undefined)

export function ETFProvider({ children }: { children: React.ReactNode }) {
  const [etfs, setETFs] = useState<ETF[]>([])
  const { isLoading, error, apiCall } = useApi()

  const fetchETFs = useCallback(async () => {
    try {
      const data = await apiCall<ETF[]>('/api/v1/etf')
      setETFs(data)
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to fetch ETFs'
      })
      throw err
    }
  }, [apiCall])

  const searchETFs = useCallback(async (query: string) => {
    try {
      const data = await apiCall<ETF[]>(`/api/v1/etf?query=${encodeURIComponent(query)}`)
      setETFs(data)
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to search ETFs'
      })
      throw err
    }
  }, [apiCall])

  const addETF = useCallback(async (etf: Omit<ETF, 'id'>) => {
    try {
      const newETF = await apiCall<ETF>('/api/v1/etf', 'POST', etf)
      setETFs(prev => [...prev, newETF])
      toast.success('Success', {
        description: 'ETF added successfully'
      })
      return newETF
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to add ETF'
      })
      throw err
    }
  }, [apiCall])

  const updateETF = useCallback(async (id: string, etf: Partial<ETF>) => {
    try {
      const updatedETF = await apiCall<ETF>(`/api/v1/etf/${id}`, 'PUT', etf)
      setETFs(prev => prev.map(e => e.id === id ? updatedETF : e))
      toast.success('Success', {
        description: 'ETF updated successfully'
      })
      return updatedETF
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to update ETF'
      })
      throw err
    }
  }, [apiCall])

  const deleteETF = useCallback(async (id: string) => {
    try {
      await apiCall(`/api/v1/etf/${id}`, 'DELETE')
      setETFs(prev => prev.filter(e => e.id !== id))
      toast.success('Success', {
        description: 'ETF deleted successfully'
      })
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to delete ETF'
      })
      throw err
    }
  }, [apiCall])

  const triggerUpdate = useCallback(async (
    id: string,
    type: 'full' | 'prices_only' | 'prices_refresh'
  ) => {
    try {
      await apiCall(`/api/v1/etf/${id}/update?update_type=${type}`, 'POST')
      toast.success('Success', {
        description: 'ETF update triggered successfully'
      })
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to trigger ETF update'
      })
      throw err
    }
  }, [apiCall])

  const getUpdateStatus = useCallback(async (id: string) => {
    try {
      return await apiCall<ETFUpdateStatus[]>(`/api/v1/etf/${id}/status`, 'GET')
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to get ETF update status'
      })
      throw err
    }
  }, [apiCall])

  const getMetrics = useCallback(async (id: string) => {
    try {
      return await apiCall<ETFMetrics>(`/api/v1/etf/${id}/metrics`, 'GET')
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to get ETF metrics'
      })
      throw err
    }
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
        triggerUpdate,
        getUpdateStatus,
        getMetrics
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