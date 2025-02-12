"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PensionType } from "@/types/pension"
import { useState } from "react"
import { PensionForm } from "./PensionForm"
import { FormData } from "@/types/pension-form"

interface PensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FormData) => void
}

/**
 * Dialog component for adding new pension plans.
 * Manages the pension type state and renders the appropriate form.
 * 
 * TODO: Add loading state during form submission
 * TODO: Add error handling for failed submissions
 * TODO: Add form validation feedback
 */
export function PensionDialog({ open, onOpenChange, onSubmit }: PensionDialogProps) {
  const [pensionType, setPensionType] = useState<PensionType>(PensionType.ETF_PLAN)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Pension Plan</DialogTitle>
        </DialogHeader>
        <PensionForm 
          type={pensionType} 
          onTypeChange={setPensionType}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
} 