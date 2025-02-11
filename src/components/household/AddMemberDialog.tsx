"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HouseholdMember } from "@/types/household"
import { UserPlus } from "lucide-react"
import { MemberForm } from "./MemberForm"

interface AddMemberDialogProps {
  onAdd: (member: Omit<HouseholdMember, "id">) => void
}

/**
 * Dialog component for adding new household members
 * 
 * Provides:
 * - "Add Member" button trigger
 * - Dialog wrapper
 * - Uses shared MemberForm component
 * - Handles dialog open/close state
 * - Passes new member data to parent component
 */
export function AddMemberDialog({ onAdd }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Household Member</DialogTitle>
        </DialogHeader>
        <MemberForm
          onSubmit={(data) => {
            onAdd(data)
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
} 