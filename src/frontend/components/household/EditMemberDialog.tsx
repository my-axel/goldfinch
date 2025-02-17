"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog"
import { HouseholdMember } from "@/frontend/types/household"
import { MemberForm } from "./MemberForm"

interface EditMemberDialogProps {
  member: HouseholdMember
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: number, updatedMember: Omit<HouseholdMember, "id">) => void
}

/**
 * Dialog component for editing existing household members
 * 
 * Provides:
 * - Dialog wrapper for editing
 * - Uses shared MemberForm component
 * - Pre-fills form with existing member data
 * - Handles dialog open/close state
 * - Passes updated member data to parent component
 */ 
export function EditMemberDialog({ member, open, onOpenChange, onEdit }: EditMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Household Member</DialogTitle>
        </DialogHeader>
        <MemberForm
          member={member}
          onSubmit={(data) => {
            onEdit(member.id, data)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}