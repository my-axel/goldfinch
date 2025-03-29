"use client"

import { 
  createContext, 
  useContext, 
  useState, 
  ReactNode 
} from 'react'

// UI state interface
interface CompanyPensionUIState {
  selectedPensionId: number | null
  isFormOpen: boolean
  activeTabIndex: number
}

// Context interface with state and setters
interface CompanyPensionUIContextType extends CompanyPensionUIState {
  setSelectedPensionId: (id: number | null) => void
  setIsFormOpen: (isOpen: boolean) => void
  setActiveTabIndex: (index: number) => void
}

// Create context with a default value
const CompanyPensionUIContext = createContext<CompanyPensionUIContextType | undefined>(undefined)

// Provider component
export function CompanyPensionUIProvider({ children }: { children: ReactNode }) {
  // UI state
  const [selectedPensionId, setSelectedPensionId] = useState<number | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  // Context value
  const value = {
    selectedPensionId,
    setSelectedPensionId,
    isFormOpen,
    setIsFormOpen,
    activeTabIndex,
    setActiveTabIndex
  }

  return (
    <CompanyPensionUIContext.Provider value={value}>
      {children}
    </CompanyPensionUIContext.Provider>
  )
}

// Hook to use the context
export function useCompanyPensionUI() {
  const context = useContext(CompanyPensionUIContext)
  
  if (context === undefined) {
    throw new Error('useCompanyPensionUI must be used within a CompanyPensionUIProvider')
  }
  
  return context
} 