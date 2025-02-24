import { useState, useCallback } from 'react'
import axios from 'axios'

interface ApiState {
  isLoading: boolean
  error: string | null
}

export function useApi() {
  const [state, setState] = useState<ApiState>({
    isLoading: false,
    error: null
  })

  const apiCall = useCallback(async <T = unknown>(
    endpoint: string, 
    method: string = 'GET', 
    data?: Record<string, unknown>
  ): Promise<T> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await axios<T>({
        method,
        url: endpoint.startsWith('/api/v1') ? endpoint : `/api/v1${endpoint}`,
        data,
      })
      setState(prev => ({ ...prev, isLoading: false, error: null }))
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      throw error
    }
  }, [])

  const get = useCallback(<T = unknown>(endpoint: string) => apiCall<T>(endpoint, 'GET'), [apiCall])
  const post = useCallback(<T = unknown>(endpoint: string, data: Record<string, unknown>) => apiCall<T>(endpoint, 'POST', data), [apiCall])
  const put = useCallback(<T = unknown>(endpoint: string, data: Record<string, unknown>) => apiCall<T>(endpoint, 'PUT', data), [apiCall])
  const del = useCallback(<T = unknown>(endpoint: string) => apiCall<T>(endpoint, 'DELETE'), [apiCall])

  return { ...state, apiCall, get, post, put, del }
} 