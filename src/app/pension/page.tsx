"use client"

import { PensionList } from "@/components/pension/PensionList"
import { PensionDialog } from "@/components/pension/PensionDialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { Pension } from "@/types/pension"
import { mockPensions, mockEtfPrices, mockHouseholdMembers } from "@/data/mockData"
import { FormData } from "@/types/pension-form"
export default function PensionPage() {
  const [pensions, setPensions] = useState<Pension[]>(mockPensions)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true)
      // TODO: Add API call to delete pension
      setPensions(pensions.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete pension:', error)
      // TODO: Add error handling
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (pension: Pension) => {
    // TODO: Implement edit functionality
    console.log('Edit pension:', pension)
  }

  const handleAdd = (data: FormData) => {
    // TODO: Add API call to create pension
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
