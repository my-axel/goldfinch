"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'

// Define the shape of your context state
interface AppState {
  // Add your state properties here
  isLoading: boolean
  error: string | null
  settings: {
    currency: string
    locale: string
  }
}

// Define the shape of your context
interface AppContextType extends AppState {
  // Add your methods here
  updateSettings: (settings: Partial<AppState['settings']>) => void
  // Add more methods as needed
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Initial state
const initialState: AppState = {
  isLoading: false,
  error: null,
  settings: {
    currency: 'USD',
    locale: 'en-US'
  }
}

// Create the provider component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState)

  // Example method to update settings
  const updateSettings = useCallback((newSettings: Partial<AppState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings
      }
    }))
  }, [])

  // Example API call method
  const apiCall = useCallback(async (endpoint: string, method: string = 'GET', data?: any) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await axios({
        method,
        url: `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        data,
      })
      setState(prev => ({ ...prev, isLoading: false }))
      return response.data
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      }))
      throw error
    }
  }, [])

  const value = {
    ...state,
    updateSettings,
    // Add more methods here as needed
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
} 