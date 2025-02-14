"use client"

import { PensionList } from "@/frontend/components/pension/PensionList"
import { PensionDialog } from "@/frontend/components/pension/PensionDialog"
import { Button } from "@/frontend/components/ui/button"
import { Plus } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { usePension } from "@/frontend/context/PensionContext"
import { type Pension, PensionType } from "@/frontend/types/pension"
import { FormData } from "@/frontend/types/pension-form"
import { toast } from "sonner"
import { useETF } from "@/frontend/context/ETFContext"
import { useHousehold } from "@/frontend/context/HouseholdContext"

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
    createEtfPension,
    createInsurancePension,
    createCompanyPension,
    updateEtfPension,
    updateInsurancePension,
    updateCompanyPension,
    deletePension,
  } = usePension()
  const { fetchETFs } = useETF()
  const { members, fetchMembers } = useHousehold()
  const initialized = useRef(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPension, setSelectedPension] = useState<Pension>()

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

  /**
   * Opens the edit dialog for a pension plan
   */
  const handleEdit = useCallback((pension: Pension) => {
    setSelectedPension(pension)
    setDialogOpen(true)
  }, [])

  /**
   * Handles both creation and updates of pension plans
   */
  const handleSubmit = useCallback(async (data: FormData) => {
    try {
      const memberId = parseInt(data.member_id)
      if (isNaN(memberId)) {
        toast.error("Error", {
          description: "Invalid member ID",
        })
        return
      }

      const baseData = {
        name: data.name,
        member_id: memberId,
        initial_capital: data.initial_capital,
        notes: undefined,
      }

      if (selectedPension) {
        // Update existing pension
        switch (data.type) {
          case PensionType.ETF_PLAN:
            await updateEtfPension(selectedPension.id, {
              ...baseData,
              type: PensionType.ETF_PLAN,
              etf_id: data.etf_id,
              start_date: selectedPension.start_date,
            })
            break
          
          case PensionType.INSURANCE:
            await updateInsurancePension(selectedPension.id, {
              ...baseData,
              type: PensionType.INSURANCE,
              provider: data.provider,
              contract_number: data.contract_number,
              guaranteed_interest: data.guaranteed_interest,
              expected_return: data.expected_return,
              start_date: data.start_date,
            })
            break
          
          case PensionType.COMPANY:
            await updateCompanyPension(selectedPension.id, {
              ...baseData,
              type: PensionType.COMPANY,
              employer: data.employer,
              vesting_period: data.vesting_period,
              matching_percentage: data.matching_percentage,
              max_employer_contribution: data.max_employer_contribution,
              start_date: data.start_date,
            })
            break
        }
      } else {
        // Create new pension
        switch (data.type) {
          case PensionType.ETF_PLAN:
            await createEtfPension({
              ...baseData,
              type: PensionType.ETF_PLAN,
              etf_id: data.etf_id,
              start_date: new Date(), // Using current date for new ETF plans
            })
            break
          
          case PensionType.INSURANCE:
            await createInsurancePension({
              ...baseData,
              type: PensionType.INSURANCE,
              provider: data.provider,
              contract_number: data.contract_number,
              guaranteed_interest: data.guaranteed_interest,
              expected_return: data.expected_return,
              start_date: data.start_date,
            })
            break
          
          case PensionType.COMPANY:
            await createCompanyPension({
              ...baseData,
              type: PensionType.COMPANY,
              employer: data.employer,
              vesting_period: data.vesting_period,
              matching_percentage: data.matching_percentage,
              max_employer_contribution: data.max_employer_contribution,
              start_date: data.start_date,
            })
            break
        }
      }

      toast.success("Success", {
        description: selectedPension 
          ? "Pension plan updated successfully" 
          : "New pension plan created successfully",
      })
      
      setDialogOpen(false)
      setSelectedPension(undefined)
    } catch (error) {
      // Error is already handled by the context
      console.error('Failed to save pension:', error)
    }
  }, [
    createEtfPension, 
    createInsurancePension, 
    createCompanyPension,
    updateEtfPension,
    updateInsurancePension,
    updateCompanyPension,
    selectedPension
  ])

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
          members={members}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      <PensionDialog 
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedPension(undefined)
        }}
        onSubmit={handleSubmit}
        pension={selectedPension}
      />
    </div>
  )
}
