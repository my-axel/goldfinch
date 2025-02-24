"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog"
import { HouseholdMemberFormData } from "@/frontend/types/household"
import { MemberForm } from "./MemberForm"

interface AddMemberDialogProps {
  onAdd: (member: HouseholdMemberFormData) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog component for adding new household members
 * 
 * Provides:
 * - Dialog wrapper
 * - Uses shared MemberForm component
 * - Controlled by parent component through open/onOpenChange props
 * - Passes new member data to parent component
 */
export function AddMemberDialog({ onAdd, open, onOpenChange }: AddMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Household Member</DialogTitle>
        </DialogHeader>
        <MemberForm
          onSubmit={(data) => {
            onAdd(data)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
} 