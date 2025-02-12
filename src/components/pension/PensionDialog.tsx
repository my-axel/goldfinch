"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PensionType, Pension } from "@/types/pension"
import { useEffect, useState } from "react"
import { PensionForm } from "./PensionForm"
import { FormData } from "@/types/pension-form"

interface PensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FormData) => void
  pension?: Pension
}

/**
 * Dialog component for adding and editing pension plans.
 * Manages the pension type state and renders the appropriate form.
 * 
 * TODO: Add loading state during form submission
 * TODO: Add error handling for failed submissions
 * TODO: Add form validation feedback
 * TODO: Add confirmation when closing with unsaved changes
 */
export function PensionDialog({ open, onOpenChange, onSubmit, pension }: PensionDialogProps) {
  const [pensionType, setPensionType] = useState<PensionType>(PensionType.ETF_PLAN)

  // Update pension type when editing an existing pension
  useEffect(() => {
    if (pension) {
      setPensionType(pension.type)
    }
  }, [pension])

  // Reset type when dialog closes
  useEffect(() => {
    if (!open) {
      setPensionType(PensionType.ETF_PLAN)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{pension ? 'Edit' : 'Add'} Pension Plan</DialogTitle>
        </DialogHeader>
        <PensionForm 
          type={pensionType} 
          onTypeChange={setPensionType}
          onSubmit={onSubmit}
          defaultValues={pension}
          isEditing={!!pension}
        />
      </DialogContent>
    </Dialog>
  )
} 