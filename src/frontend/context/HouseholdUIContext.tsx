"use client"

import { 
  createContext, 
  useContext, 
  useState, 
  ReactNode 
} from 'react'

// UI state interface
interface HouseholdUIState {
  selectedMemberId: number | null
  isFormOpen: boolean
}

// Context interface with state and setters
interface HouseholdUIContextType extends HouseholdUIState {
  setSelectedMemberId: (id: number | null) => void
  setIsFormOpen: (isOpen: boolean) => void
}

// Create context with a default value
const HouseholdUIContext = createContext<HouseholdUIContextType | undefined>(undefined)

// Provider component
export function HouseholdUIProvider({ children }: { children: ReactNode }) {
  // UI state
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Context value
  const value = {
    selectedMemberId,
    setSelectedMemberId,
    isFormOpen,
    setIsFormOpen,
  }

  return (
    <HouseholdUIContext.Provider value={value}>
      {children}
    </HouseholdUIContext.Provider>
  )
}

// Hook to use the context
export function useHouseholdUI() {
  const context = useContext(HouseholdUIContext)
  
  if (context === undefined) {
    throw new Error('useHouseholdUI must be used within a HouseholdUIProvider')
  }
  
  return context
} 