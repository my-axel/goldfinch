"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PensionType } from "@/types/pension"
import { useState } from "react"
import { PensionForm } from "./PensionForm"

type FormData = {
  type: PensionType
  name: string
  member_id: string
  start_date: Date
  initial_capital: number
} & (
  | { type: PensionType.ETF_PLAN, automatic_rebalancing: boolean }
  | { type: PensionType.INSURANCE, provider: string, contract_number: string }
  | { type: PensionType.COMPANY, employer: string, vesting_period: number }
)

interface PensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FormData) => void
}

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