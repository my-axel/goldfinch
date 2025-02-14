import { Pension } from "@/frontend/types/pension"
import { AddPensionDialog } from "./AddPensionDialog"
import { EditPensionDialog } from "./EditPensionDialog"

interface PensionDialogRouterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  pension?: Pension
}

/**
 * Router component that renders the appropriate pension dialog based on mode.
 * Handles routing between add and edit dialogs.
 */
export function PensionDialogRouter({ open, onOpenChange, mode, pension }: PensionDialogRouterProps) {
  if (mode === "edit" && !pension) {
    console.error("Edit mode requires a pension to be provided")
    return null
  }

  if (mode === "add") {
    return (
      <AddPensionDialog
        open={open}
        onOpenChange={onOpenChange}
      />
    )
  }

  return (
    <EditPensionDialog
      open={open}
      onOpenChange={onOpenChange}
      pension={pension!}
    />
  )
} 