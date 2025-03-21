"use client"

import { 
  createContext, 
  useContext, 
  useState, 
  ReactNode 
} from 'react'

// UI state interface
interface StatePensionUIState {
  selectedPensionId: number | null
  isFormOpen: boolean
}

// Context interface with state and setters
interface StatePensionUIContextType extends StatePensionUIState {
  setSelectedPensionId: (id: number | null) => void
  setIsFormOpen: (isOpen: boolean) => void
}

// Create context with a default value
const StatePensionUIContext = createContext<StatePensionUIContextType | undefined>(undefined)

// Provider component
export function StatePensionUIProvider({ children }: { children: ReactNode }) {
  // UI state
  const [selectedPensionId, setSelectedPensionId] = useState<number | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Context value
  const value = {
    selectedPensionId,
    setSelectedPensionId,
    isFormOpen,
    setIsFormOpen,
  }

  return (
    <StatePensionUIContext.Provider value={value}>
      {children}
    </StatePensionUIContext.Provider>
  )
}

// Hook to use the context
export function useStatePensionUI() {
  const context = useContext(StatePensionUIContext)
  
  if (context === undefined) {
    throw new Error('useStatePensionUI must be used within a StatePensionUIProvider')
  }
  
  return context
} 