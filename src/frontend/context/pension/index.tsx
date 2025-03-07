"use client"

/**
 * Pension Context - Main Entry Point
 * 
 * This file serves as the main entry point for the Pension Context system, which has been
 * modularized using a factory pattern to improve maintainability and organization.
 * 
 * Architecture Overview:
 * ---------------------
 * The pension context is split into multiple files:
 * - index.tsx (this file): Main entry point that composes all operations
 * - types.ts: Contains all type definitions for the pension context
 * - core.tsx: Contains the context creation and core shared operations
 * - etfOperations.ts: ETF pension specific operations
 * - insuranceOperations.ts: Insurance pension specific operations
 * - companyOperations.ts: Company pension specific operations
 * - statementOperations.ts: Statement-related operations
 * 
 * How to Make Changes:
 * -------------------
 * 1. To modify an existing operation:
 *    - Find the appropriate operation file (e.g., etfOperations.ts for ETF-related functions)
 *    - Update the operation function there
 *    - The changes will automatically be available through the context
 * 
 * 2. To add a new operation:
 *    - Add the operation to the appropriate file using the factory pattern
 *    - Add the operation to the PensionContextType interface in types.ts
 *    - Initialize the operation in this file using useMemo with proper dependencies
 *    - Add the operation to the context provider value
 * 
 * 3. To modify shared state:
 *    - Update the state in this file
 *    - Update any operations that depend on that state
 * 
 * Factory Pattern:
 * ---------------
 * Each operation is implemented as a factory function that takes dependencies as parameters
 * and returns the actual operation function. This approach:
 * - Makes dependencies explicit
 * - Improves testability
 * - Allows for better code organization
 * 
 * Example:
 * function createSomeOperation(dependency1, dependency2) {
 *   return async (param1, param2) => {
 *     // Implementation using dependencies
 *   }
 * }
 * 
 * // Usage in this file:
 * const someOperation = useMemo(
 *   () => createSomeOperation(dependency1, dependency2),
 *   [dependency1, dependency2]
 * )
 */

import { useContext, useState, useCallback, useMemo } from 'react'
import { useApi } from '@/frontend/hooks/useApi'
import { Pension, PensionType } from '@/frontend/types/pension'
import { PensionStatistics, PensionStatusUpdate } from '@/frontend/types/pension-statistics'
import { toast } from 'sonner'

// Import operations
import { createEtfPensionOperation, updateEtfPensionOperation } from './etfOperations'
import { 
  createInsurancePensionOperation, 
  updateInsurancePensionOperation,
  deleteInsurancePensionStatementOperation,
  createInsurancePensionWithStatementOperation,
  createInsurancePensionStatementOperation,
  updateInsurancePensionStatementOperation,
  updateInsurancePensionWithStatementOperation
} from './insuranceOperations'
import { 
  createCompanyPensionOperation, 
  updateCompanyPensionOperation,
  createCompanyPensionWithStatementOperation,
  updateCompanyPensionWithStatementOperation,
  addOneTimeInvestmentOperation,
  createContributionHistoryOperation
} from './companyOperations'
import {
  createCompanyPensionStatementOperation,
  getCompanyPensionStatementsOperation,
  getLatestCompanyPensionStatementOperation,
  getCompanyPensionStatementOperation,
  updateCompanyPensionStatementOperation,
  deleteCompanyPensionStatementOperation
} from './statementOperations'

// Import core operations
import {
  fetchPensionsOperation,
  fetchPensionOperation,
  deletePensionOperation,
  realizeHistoricalContributionsOperation,
  fetchPensionStatisticsOperation,
  updatePensionStatusOperation
} from './core'

// Import context and types
import { PensionContext } from './core'

/**
 * Hook to access the pension context
 * @returns The pension context with all operations and state
 */
export function usePension() {
  const context = useContext(PensionContext)
  if (context === undefined) {
    throw new Error('usePension must be used within a PensionProvider')
  }
  return context
}

/**
 * Provider component for the pension context
 * This component initializes all operations with their dependencies and provides
 * the context to its children.
 */
export function PensionProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, error, get, post, put, del } = useApi()
  
  // Shared state
  const [pensions, setPensions] = useState<Pension[]>([])
  const [selectedPension, setSelectedPension] = useState<Pension | null>(null)
  const [pensionStatistics, setPensionStatistics] = useState<Record<number, PensionStatistics>>({})
  const [isLoadingStatistics, setIsLoadingStatistics] = useState<Record<number, boolean>>({})

  // Core functions
  const fetchPensions = useCallback(async (memberId?: number) => {
    try {
      const allPensions = await fetchPensionsOperation(get)(memberId)
      setPensions(allPensions)
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to fetch pensions'
      })
      throw err
    }
  }, [get])

  const fetchPension = useCallback(async (id: number, pensionType?: PensionType) => {
    try {
      const pension = await fetchPensionOperation(get)(id, pensionType)
      
      // Update both states in a more stable way
      setSelectedPension(pension)
      
      // Update the pension in the array without changing the order
      setPensions(prev => {
        const index = prev.findIndex(p => p.id === id)
        if (index >= 0) {
          const newPensions = [...prev]
          newPensions[index] = pension
          return newPensions
        } else {
          return [...prev, pension]
        }
      })
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to fetch pension details'
      })
      throw err
    }
  }, [get]) // Remove pensions dependency

  const deletePension = useCallback(async (id: number) => {
    try {
      await deletePensionOperation(del, pensions)(id)
      // Update local state
      setPensions(prev => prev.filter(p => p.id !== id))
      if (selectedPension?.id === id) {
        setSelectedPension(null)
      }
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to delete pension'
      })
      throw err
    }
  }, [del, pensions, selectedPension])

  const realizeHistoricalContributions = useCallback(async (pensionId: number) => {
    try {
      await realizeHistoricalContributionsOperation(
        post as <T>(url: string, data: unknown) => Promise<T>,
        fetchPension,
        pensions
      )(pensionId)
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to realize historical contributions'
      })
      throw err
    }
  }, [post, fetchPension, pensions])

  const fetchPensionStatistics = useCallback(async (pensionId: number, pensionType?: PensionType): Promise<PensionStatistics> => {
    try {
      setIsLoadingStatistics(prev => ({ ...prev, [pensionId]: true }))
      const statistics = await fetchPensionStatisticsOperation(get, pensions)(pensionId, pensionType)
      setPensionStatistics(prev => ({ ...prev, [pensionId]: statistics }))
      return statistics
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to fetch pension statistics'
      })
      throw err
    } finally {
      setIsLoadingStatistics(prev => ({ ...prev, [pensionId]: false }))
    }
  }, [get, pensions])

  const getPensionStatistics = useCallback(async (pensionId: number): Promise<PensionStatistics> => {
    // Check if we already have the statistics
    if (pensionStatistics[pensionId]) {
      return pensionStatistics[pensionId]
    }
    
    // Otherwise fetch them
    return fetchPensionStatistics(pensionId)
  }, [pensionStatistics, fetchPensionStatistics])

  const updatePensionStatus = useCallback(async (pensionId: number, status: PensionStatusUpdate): Promise<void> => {
    try {
      await updatePensionStatusOperation(
        put as <T>(url: string, data: unknown) => Promise<T>,
        fetchPension,
        pensions
      )(pensionId, status)
    } catch (err) {
      toast.error('Error', {
        description: 'Failed to update pension status'
      })
      throw err
    }
  }, [put, fetchPension, pensions])

  // Initialize operations with dependencies
  // ETF operations
  const createEtfPension = useMemo(
    () => createEtfPensionOperation(
      post as <T>(url: string, data: unknown) => Promise<T>,
      fetchPensions
    ),
    [post, fetchPensions]
  )

  const updateEtfPension = useMemo(
    () => updateEtfPensionOperation(
      put as <T>(url: string, data: unknown) => Promise<T>,
      fetchPensions,
      fetchPension,
      selectedPension
    ),
    [put, fetchPensions, fetchPension, selectedPension]
  )

  // Insurance operations
  const createInsurancePension = useMemo(
    () => createInsurancePensionOperation(
      post as <T>(url: string, data: unknown) => Promise<T>,
      fetchPensions
    ),
    [post, fetchPensions]
  )

  const createInsurancePensionStatement = useMemo(
    () => createInsurancePensionStatementOperation(
      post as <T>(url: string, data: unknown) => Promise<T>
    ),
    [post]
  )

  const createInsurancePensionWithStatement = useMemo(
    () => createInsurancePensionWithStatementOperation(
      createInsurancePension,
      createInsurancePensionStatement
    ),
    [createInsurancePension, createInsurancePensionStatement]
  )

  const updateInsurancePension = useMemo(
    () => updateInsurancePensionOperation(
      put as <T>(url: string, data: unknown) => Promise<T>,
      fetchPensions,
      fetchPension,
      selectedPension
    ),
    [put, fetchPensions, fetchPension, selectedPension]
  )

  const deleteInsurancePensionStatement = useMemo(
    () => deleteInsurancePensionStatementOperation(
      del,
      fetchPension,
      selectedPension
    ),
    [del, fetchPension, selectedPension]
  )

  const updateInsurancePensionStatement = useMemo(
    () => updateInsurancePensionStatementOperation(
      put as <T>(url: string, data: unknown) => Promise<T>,
      fetchPension,
      selectedPension
    ),
    [put, fetchPension, selectedPension]
  )

  const updateInsurancePensionWithStatement = useMemo(
    () => updateInsurancePensionWithStatementOperation(
      updateInsurancePension,
      updateInsurancePensionStatement,
      fetchPension,
      selectedPension
    ),
    [updateInsurancePension, updateInsurancePensionStatement, fetchPension, selectedPension]
  )

  // Company operations
  const createCompanyPension = useMemo(
    () => createCompanyPensionOperation(
      post as <T>(url: string, data: unknown) => Promise<T>,
      fetchPensions
    ),
    [post, fetchPensions]
  )

  const updateCompanyPension = useMemo(
    () => updateCompanyPensionOperation(
      put as <T>(url: string, data: unknown) => Promise<T>,
      fetchPensions,
      fetchPension,
      selectedPension
    ),
    [put, fetchPensions, fetchPension, selectedPension]
  )

  // Statement operations
  const createCompanyPensionStatement = useMemo(
    () => createCompanyPensionStatementOperation(
      post as <T>(url: string, data: unknown) => Promise<T>,
      fetchPension,
      selectedPension
    ),
    [post, fetchPension, selectedPension]
  )

  const getCompanyPensionStatements = useMemo(
    () => getCompanyPensionStatementsOperation(
      get as <T>(url: string) => Promise<T>
    ),
    [get]
  )

  const getLatestCompanyPensionStatement = useMemo(
    () => getLatestCompanyPensionStatementOperation(
      get as <T>(url: string) => Promise<T>
    ),
    [get]
  )

  const getCompanyPensionStatement = useMemo(
    () => getCompanyPensionStatementOperation(
      get as <T>(url: string) => Promise<T>
    ),
    [get]
  )

  const updateCompanyPensionStatement = useMemo(
    () => updateCompanyPensionStatementOperation(
      put as <T>(url: string, data: unknown) => Promise<T>,
      fetchPension,
      selectedPension
    ),
    [put, fetchPension, selectedPension]
  )

  const deleteCompanyPensionStatement = useMemo(
    () => deleteCompanyPensionStatementOperation(
      del,
      fetchPension,
      selectedPension
    ),
    [del, fetchPension, selectedPension]
  )

  // Composite operations
  const createCompanyPensionWithStatement = useMemo(
    () => createCompanyPensionWithStatementOperation(
      createCompanyPension,
      createCompanyPensionStatement
    ),
    [createCompanyPension, createCompanyPensionStatement]
  )

  const updateCompanyPensionWithStatement = useMemo(
    () => updateCompanyPensionWithStatementOperation(
      updateCompanyPension, 
      updateCompanyPensionStatement, 
      fetchPension, 
      selectedPension
    ),
    [updateCompanyPension, updateCompanyPensionStatement, fetchPension, selectedPension]
  )

  const addOneTimeInvestment = useMemo(
    () => addOneTimeInvestmentOperation(
      post as <T>(url: string, data: unknown) => Promise<T>,
      fetchPension,
      pensions
    ),
    [post, fetchPension, pensions]
  )

  const createContributionHistory = useMemo(
    () => createContributionHistoryOperation(
      post as <T>(url: string, data: unknown) => Promise<T>,
      fetchPension,
      pensions
    ),
    [post, fetchPension, pensions]
  )

  return (
    <PensionContext.Provider
      value={{
        isLoading,
        error,
        pensions,
        selectedPension,
        fetchPensions,
        fetchPension,
        createEtfPension,
        createInsurancePension,
        createInsurancePensionStatement,
        createInsurancePensionWithStatement,
        createCompanyPension,
        createCompanyPensionWithStatement,
        updateEtfPension,
        updateInsurancePension,
        updateCompanyPension,
        updateCompanyPensionWithStatement,
        deletePension,
        addOneTimeInvestment,
        createContributionHistory,
        realizeHistoricalContributions,
        getPensionStatistics,
        updatePensionStatus,
        pensionStatistics,
        isLoadingStatistics,
        fetchPensionStatistics,
        getCompanyPensionStatements,
        getLatestCompanyPensionStatement,
        getCompanyPensionStatement,
        updateCompanyPensionStatement,
        createCompanyPensionStatement,
        deleteCompanyPensionStatement,
        deleteInsurancePensionStatement,
        updateInsurancePensionWithStatement,
        updateInsurancePensionStatement,
      }}
    >
      {children}
    </PensionContext.Provider>
  )
}
