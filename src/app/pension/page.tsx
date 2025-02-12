"use client"

import { PensionList } from "@/components/pension/PensionList"
import { PensionDialog } from "@/components/pension/PensionDialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { Pension } from "@/types/pension"
import { mockPensions, mockEtfPrices, mockHouseholdMembers } from "@/data/mockData"
import { FormData } from "@/types/pension-form"

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
  const [pensions, setPensions] = useState<Pension[]>(mockPensions)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  /**
   * Handles the deletion of a pension plan.
   * 
   * TODO: Add API call to delete pension
   * TODO: Add confirmation dialog
   * TODO: Add error handling with user feedback
   */
  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true)
      // TODO: Add API call to delete pension
      setPensions(pensions.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete pension:', error)
      // TODO: Add error handling with toast notification
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles editing of an existing pension plan.
   * 
   * TODO: Implement edit functionality
   * TODO: Add API call to update pension
   * TODO: Add form validation
   * TODO: Add optimistic updates
   */
  const handleEdit = (pension: Pension) => {
    console.log('Edit pension:', pension)
  }

  /**
   * Handles the creation of a new pension plan.
   * 
   * TODO: Add API call to create pension
   * TODO: Add error handling with user feedback
   * TODO: Add optimistic updates
   * TODO: Add form data transformation to match API requirements
   */
  const handleAdd = (data: FormData) => {
    console.log('New pension data:', data)
    setDialogOpen(false)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pension Plans</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Pension
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <PensionList
          pensions={pensions}
          etfPrices={mockEtfPrices}
          members={mockHouseholdMembers}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      <PensionDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAdd}
      />
    </div>
  )
}
