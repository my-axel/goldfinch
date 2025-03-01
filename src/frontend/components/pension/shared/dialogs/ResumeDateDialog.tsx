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

interface ResumeDateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (resumeDate: Date) => Promise<void>
}

export function ResumeDateDialog({
  open,
  onOpenChange,
  onConfirm,
}: ResumeDateDialogProps) {
  const [resumeDate, setResumeDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true)
      await onConfirm(new Date(resumeDate))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume Pension Plan</DialogTitle>
          <DialogDescription>
            Select the date from which you want to resume contributions to your pension plan.
            All planned contributions will restart from this date.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="resume-date">Resume Date</Label>
            <Input
              id="resume-date"
              type="date"
              value={resumeDate}
              onChange={(e) => setResumeDate(e.target.value)}
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