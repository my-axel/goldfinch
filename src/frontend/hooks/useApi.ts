import { useState } from 'react'
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

  const apiCall = async <T = unknown>(
    endpoint: string, 
    method: string = 'GET', 
    data?: Record<string, unknown>
  ): Promise<T> => {
    setState({ isLoading: true, error: null })
    try {
      const response = await axios<T>({
        method,
        url: endpoint.startsWith('/api/v1') ? endpoint : `/api/v1${endpoint}`,
        data,
      })
      setState({ isLoading: false, error: null })
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setState({ isLoading: false, error: errorMessage })
      throw error
    }
  }

  const get = <T = unknown>(endpoint: string) => apiCall<T>(endpoint, 'GET')
  const post = <T = unknown>(endpoint: string, data: Record<string, unknown>) => apiCall<T>(endpoint, 'POST', data)
  const put = <T = unknown>(endpoint: string, data: Record<string, unknown>) => apiCall<T>(endpoint, 'PUT', data)
  const del = <T = unknown>(endpoint: string) => apiCall<T>(endpoint, 'DELETE')

  return { ...state, apiCall, get, post, put, del }
} 