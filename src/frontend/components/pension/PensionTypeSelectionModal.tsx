"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog"
import { PensionType } from "@/frontend/types/pension"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/frontend/components/ui/radio-group"
import { Label } from "@/frontend/components/ui/label"

interface PensionTypeSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PensionTypeSelectionModal({ open, onOpenChange }: PensionTypeSelectionModalProps) {
  const router = useRouter()

  const handleTypeSelect = (type: PensionType) => {
    onOpenChange(false) // Close the modal
    
    // Navigate to the appropriate form page
    switch (type) {
      case PensionType.ETF_PLAN:
        router.push('/pension/etf/new')
        break
      case PensionType.INSURANCE:
        router.push('/pension/insurance/new')
        break
      case PensionType.COMPANY:
        router.push('/pension/company/new')
        break
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Pension Type</DialogTitle>
        </DialogHeader>
        <RadioGroup
          onValueChange={(value) => handleTypeSelect(value as PensionType)}
          className="gap-6"
        >
          <div className="flex items-start space-x-4 space-y-0">
            <RadioGroupItem value={PensionType.ETF_PLAN} id="etf" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="etf" className="font-medium">
                ETF Plan
              </Label>
              <p className="text-sm text-muted-foreground">
                A flexible pension plan that invests in Exchange-Traded Funds (ETFs). 
                Suitable for those who want control over their investment strategy and 
                are comfortable with market fluctuations.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 space-y-0">
            <RadioGroupItem value={PensionType.INSURANCE} id="insurance" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="insurance" className="font-medium">
                Insurance
              </Label>
              <p className="text-sm text-muted-foreground">
                A traditional insurance-based pension plan with guaranteed returns. 
                Ideal for those who prefer stability and guaranteed payouts over 
                potentially higher but variable returns.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 space-y-0">
            <RadioGroupItem value={PensionType.COMPANY} id="company" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="company" className="font-medium">
                Company
              </Label>
              <p className="text-sm text-muted-foreground">
                An employer-sponsored pension plan that may include matching contributions. 
                Best for tracking workplace pensions and managing employer benefits.
              </p>
            </div>
          </div>
        </RadioGroup>
      </DialogContent>
    </Dialog>
  )
} 