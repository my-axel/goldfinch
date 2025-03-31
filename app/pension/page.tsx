"use client"

import { useCallback } from 'react'
import { PensionList } from '@/frontend/components/pension/shared/PensionList'
import { useHouseholdMembers } from '@/frontend/hooks/useHouseholdMembers'
import { LoadingState } from '@/frontend/components/shared/LoadingState'
import { toast } from 'sonner'
import { PensionList as PensionListType } from '@/frontend/types/pension'
import { usePensionList, useDeletePension } from '@/frontend/hooks/pension/usePensionList'

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
  // Use the new React Query hooks for fetching pensions
  const { 
    data: pensions = [], 
    isLoading: isPensionsLoading,
    refetch: refetchPensions
  } = usePensionList()
  
  // Use React Query for household members (already implemented)
  const { 
    data: members = [], 
    isLoading: isMembersLoading 
  } = useHouseholdMembers()
  
  // Use the new React Query mutation hook for deleting pensions
  const { mutateAsync: deletePensionMutation } = useDeletePension()
  
  // Handle pension deletion
  const handleDelete = useCallback(async (id: number) => {
    // Find the pension type from the list of pensions
    const pension = pensions.find(p => p.id === id)
    if (!pension) {
      toast.error('Pension not found')
      return
    }
    
    try {
      await deletePensionMutation({ id, pensionType: pension.type })
      toast.success('Pension deleted successfully')
      // Refresh the list after deletion
      await refetchPensions()
    } catch (error) {
      console.error('Failed to delete pension:', error)
      toast.error('Failed to delete pension')
    }
  }, [pensions, deletePensionMutation, refetchPensions])
  
  // Determine if we're still loading data
  const isLoading = isPensionsLoading || isMembersLoading

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
          pensions={pensions as PensionListType[]}
          members={members}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
