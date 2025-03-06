"use client"

import { useState } from "react"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/frontend/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { ETFPensionFormData } from "@/frontend/types/pension-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card"
import { Input } from "@/frontend/components/ui/input"
import { ETFSearchCombobox } from "@/frontend/components/etf/ETFSearchCombobox"
import { Button } from "@/frontend/components/ui/button"
import { Badge } from "@/frontend/components/ui/badge"
import { PauseCircle, PlayCircle } from "lucide-react"
import { usePension } from "@/frontend/context/pension"
import { PensionStatusUpdate } from "@/frontend/types/pension-statistics"
import { PauseConfirmationDialog } from "@/frontend/components/pension/shared/dialogs/PauseConfirmationDialog"
import { ResumeDateDialog } from "@/frontend/components/pension/shared/dialogs/ResumeDateDialog"
import { ETFPension } from "@/frontend/types/pension"

interface EditETFPensionBasicInformationFormProps {
  form: UseFormReturn<ETFPensionFormData>
}

export function EditETFPensionBasicInformationForm({ form }: EditETFPensionBasicInformationFormProps) {
  const { selectedPension, updatePensionStatus } = usePension()
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  // Cast selectedPension to ETFPension since we know this component is only used for ETF pensions
  const etfPension = selectedPension as ETFPension | null

  const handlePause = async (pauseDate: Date) => {
    if (!etfPension) return

    const status: PensionStatusUpdate = {
      status: 'PAUSED',
      paused_at: pauseDate.toISOString().split('T')[0]
    }

    await updatePensionStatus(etfPension.id, status)
    setShowPauseDialog(false)
  }

  const handleResume = async (resumeDate: Date) => {
    if (!etfPension) return

    const status: PensionStatusUpdate = {
      status: 'ACTIVE',
      resume_at: resumeDate.toISOString().split('T')[0]
    }

    await updatePensionStatus(etfPension.id, status)
    setShowResumeDialog(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div className="space-y-1.5">
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Manage your ETF pension plan details and status
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={etfPension?.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {etfPension?.status === 'ACTIVE' ? 'Active' : 'Paused'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                if (etfPension?.status === 'ACTIVE') {
                  setShowPauseDialog(true)
                } else {
                  setShowResumeDialog(true)
                }
              }}
            >
              {etfPension?.status === 'ACTIVE' ? (
                <>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_2fr] gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My ETF Investment" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="etf_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ETF</FormLabel>
                  <FormControl>
                    <ETFSearchCombobox
                      value={field.value}
                      onSelect={(etf) => field.onChange(etf.id)}
                      readOnly={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <PauseConfirmationDialog
        open={showPauseDialog}
        onOpenChange={setShowPauseDialog}
        onConfirm={handlePause}
      />

      <ResumeDateDialog
        open={showResumeDialog}
        onOpenChange={setShowResumeDialog}
        onConfirm={handleResume}
      />
    </>
  )
} 