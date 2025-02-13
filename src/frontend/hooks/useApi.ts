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
  ) => {
    setState({ isLoading: true, error: null })
    try {
      const response = await axios<T>({
        method,
        url: `/api/v1${endpoint}`,
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

  return { ...state, apiCall }
} 