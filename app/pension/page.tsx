"use client"

import { PensionList } from "@/frontend/components/pension/PensionList"
import { useState, useEffect, useCallback, useRef } from "react"
import { usePension } from "@/frontend/context/PensionContext"
import { useETF } from "@/frontend/context/ETFContext"
import { useHousehold } from "@/frontend/context/HouseholdContext"
import { toast } from "sonner"
import { PensionTypeSelectionModal } from "@/frontend/components/pension/PensionTypeSelectionModal"

/**
 * Main pension management page component. Displays a list of all pension plans
 * and provides functionality to add, edit, and delete pension plans.
 * 
 * TODO: Replace mock data with API calls
 * TODO: Add error handling with toast notifications
 * TODO: Add loading states for API operations
 * TODO: Add pagination for pension list
 * TODO: Add filtering and sorting options
 */
export default function PensionPage() {
  const { 
    pensions, 
    isLoading, 
    error,
    fetchPensions,
    deletePension,
  } = usePension()
  const { fetchETFs } = useETF()
  const { members, fetchMembers } = useHousehold()
  const initialized = useRef(false)

  const [typeSelectionOpen, setTypeSelectionOpen] = useState(false)

  useEffect(() => {
    if (!initialized.current) {
      Promise.all([
        fetchPensions(),
        fetchETFs(),
        fetchMembers()
      ])
      initialized.current = true
    }
  }, [fetchPensions, fetchETFs, fetchMembers])

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error("Error", {
        description: error,
      })
    }
  }, [error])

  /**
   * Handles the deletion of a pension plan.
   */
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deletePension(id)
      toast.success("Success", {
        description: "Pension plan deleted successfully",
      })
    } catch (error) {
      // Error is already handled by the context
      console.error('Failed to delete pension:', error)
    }
  }, [deletePension])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pension Plans</h1>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <PensionList
          pensions={pensions}
          members={members}
          onDelete={handleDelete}
        />
      )}

      <PensionTypeSelectionModal
        open={typeSelectionOpen}
        onOpenChange={setTypeSelectionOpen}
      />
    </div>
  )
}
