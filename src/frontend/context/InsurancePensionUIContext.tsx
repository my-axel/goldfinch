"use client"

import { createContext, useContext, useState } from 'react'

interface InsurancePensionUIContextType {
  selectedStatementId: number | null
  setSelectedStatementId: (id: number | null) => void
  isAddingStatement: boolean
  setIsAddingStatement: (isAdding: boolean) => void
  isEditingStatement: boolean
  setIsEditingStatement: (isEditing: boolean) => void
  currentEditingStatementId: number | null
  setCurrentEditingStatementId: (id: number | null) => void
  showDeleteStatementDialog: boolean
  setShowDeleteStatementDialog: (show: boolean) => void
  statementToDelete: number | null
  setStatementToDelete: (id: number | null) => void
}

const InsurancePensionUIContext = createContext<InsurancePensionUIContextType | undefined>(undefined)

export function InsurancePensionUIProvider({ children }: { children: React.ReactNode }) {
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null)
  const [isAddingStatement, setIsAddingStatement] = useState(false)
  const [isEditingStatement, setIsEditingStatement] = useState(false)
  const [currentEditingStatementId, setCurrentEditingStatementId] = useState<number | null>(null)
  const [showDeleteStatementDialog, setShowDeleteStatementDialog] = useState(false)
  const [statementToDelete, setStatementToDelete] = useState<number | null>(null)

  return (
    <InsurancePensionUIContext.Provider
      value={{
        selectedStatementId,
        setSelectedStatementId,
        isAddingStatement,
        setIsAddingStatement,
        isEditingStatement,
        setIsEditingStatement,
        currentEditingStatementId,
        setCurrentEditingStatementId,
        showDeleteStatementDialog,
        setShowDeleteStatementDialog,
        statementToDelete,
        setStatementToDelete
      }}
    >
      {children}
    </InsurancePensionUIContext.Provider>
  )
}

export function useInsurancePensionUI() {
  const context = useContext(InsurancePensionUIContext)
  if (context === undefined) {
    throw new Error('useInsurancePensionUI must be used within a InsurancePensionUIProvider')
  }
  return context
} 