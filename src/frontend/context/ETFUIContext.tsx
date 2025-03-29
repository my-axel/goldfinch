"use client"

import { createContext, useContext, useState } from 'react'

interface ETFUIContextType {
  selectedETFId: string | null
  setSelectedETFId: (id: string | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const ETFUIContext = createContext<ETFUIContextType | undefined>(undefined)

export function ETFUIProvider({ children }: { children: React.ReactNode }) {
  const [selectedETFId, setSelectedETFId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <ETFUIContext.Provider
      value={{
        selectedETFId,
        setSelectedETFId,
        searchQuery,
        setSearchQuery,
        isModalOpen,
        openModal,
        closeModal
      }}
    >
      {children}
    </ETFUIContext.Provider>
  )
}

export function useETFUI() {
  const context = useContext(ETFUIContext)
  if (!context) {
    throw new Error('useETFUI must be used within ETFUIProvider')
  }
  return context
} 