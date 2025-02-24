"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog"
import { Button } from "@/frontend/components/ui/button"
import { Input } from "@/frontend/components/ui/input"
import { Label } from "@/frontend/components/ui/label"

interface PauseConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (pauseDate: Date) => Promise<void>
}

export function PauseConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
}: PauseConfirmationDialogProps) {
  const [pauseDate, setPauseDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true)
      await onConfirm(new Date(pauseDate))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pause Pension Plan</DialogTitle>
          <DialogDescription>
            This will pause all future contributions to your pension plan from the selected date.
            You can resume contributions at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pause-date">Pause Date</Label>
            <Input
              id="pause-date"
              type="date"
              value={pauseDate}
              onChange={(e) => setPauseDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 