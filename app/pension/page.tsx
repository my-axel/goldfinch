"use client"

import { useEffect, useState, useCallback } from 'react'
import { PensionList } from '@/frontend/components/pension/shared/PensionList'
import { usePension } from '@/frontend/context/pension'
import { useHousehold } from '@/frontend/context/HouseholdContext'
import { LoadingState } from '@/frontend/components/shared/LoadingState'
import { toast } from 'sonner'

/**
 * Pension Page Component
 * 
 * This page displays all pension plans for all household members.
 * It uses the PensionList component to render the list of pensions.
 * 
 * Features:
 * - Fetches and displays all pension plans
 * - Groups pensions by household member
 * - Allows adding new pensions
 * - Allows editing and deleting existing pensions
 * - Shows loading state while data is being fetched
 */
export default function PensionPage() {
  const { 
    pensions, 
    fetchListPensions,
    deletePension,
    isLoading: isPensionsLoading
  } = usePension()
  
  const { 
    members, 
    fetchMembers, 
    isLoading: isMembersLoading 
  } = useHousehold()
  
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Initialize data
  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([
          fetchListPensions(), // Use the optimized function instead
          fetchMembers()
        ])
      } catch (error) {
        console.error('Failed to initialize pension page:', error)
      } finally {
        setIsInitializing(false)
      }
    }
    
    initData()
  }, [fetchListPensions, fetchMembers])
  
  // Handle pension deletion
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deletePension(id)
      toast.success('Pension deleted successfully')
      // Refresh the list after deletion
      await fetchListPensions()
    } catch (error) {
      console.error('Failed to delete pension:', error)
      toast.error('Failed to delete pension')
    }
  }, [deletePension, fetchListPensions])
  
  // Determine if we're still loading data
  const isLoading = isInitializing || isPensionsLoading || isMembersLoading

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pension Plans</h1>
          <p className="text-muted-foreground mt-2">
            Manage your ETF, insurance, and company pension plans for each household member
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading pension plans..." />
      ) : (
        <PensionList
          pensions={pensions}
          members={members}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
