"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/frontend/components/ui/dialog"
import { PensionType } from "@/frontend/types/pension"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/frontend/components/ui/radio-group"
import { Label } from "@/frontend/components/ui/label"
import { Button } from "@/frontend/components/ui/button"
import { useState } from "react"
import { LineChart, Shield, Building2, Landmark } from "lucide-react"
import { getNewPensionRoute } from "@/frontend/lib/routes"

interface PensionTypeSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
}

export function PensionTypeSelectionModal({ open, onOpenChange, memberId }: PensionTypeSelectionModalProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<PensionType | null>(null)

  const handleTypeSelect = (type: PensionType) => {
    setSelectedType(type)
  }

  const handleConfirm = () => {
    if (!selectedType) return

    onOpenChange(false) // Close the modal
    router.push(getNewPensionRoute(selectedType, memberId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Choose Pension Type</DialogTitle>
          <DialogDescription>
            Choose the type of pension you want to create.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          onValueChange={(value) => handleTypeSelect(value as PensionType)}
          className="space-y-4"
          value={selectedType || ""}
        >
          <div 
            className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer group transition-colors"
            onClick={() => handleTypeSelect(PensionType.ETF_PLAN)}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value={PensionType.ETF_PLAN} id="etf" />
                <LineChart className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <Label htmlFor="etf" className="font-medium">
                  ETF Plan
                </Label>
              </div>
              <p className="text-sm text-muted-foreground pl-9">
                A flexible pension plan that invests in Exchange-Traded Funds (ETFs). 
                Suitable for those who want control over their investment strategy and 
                are comfortable with market fluctuations.
              </p>
            </div>
          </div>

          <div 
            className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer group transition-colors"
            onClick={() => handleTypeSelect(PensionType.INSURANCE)}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value={PensionType.INSURANCE} id="insurance" />
                <Shield className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <Label htmlFor="insurance" className="font-medium">
                  Insurance
                </Label>
              </div>
              <p className="text-sm text-muted-foreground pl-9">
                A traditional insurance-based pension plan with guaranteed returns. 
                Ideal for those who prefer stability and guaranteed payouts over 
                potentially higher but variable returns.
              </p>
            </div>
          </div>

          <div 
            className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer group transition-colors"
            onClick={() => handleTypeSelect(PensionType.COMPANY)}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value={PensionType.COMPANY} id="company" />
                <Building2 className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <Label htmlFor="company" className="font-medium">
                  Company
                </Label>
              </div>
              <p className="text-sm text-muted-foreground pl-9">
                An employer-sponsored pension plan that may include matching contributions. 
                Best for tracking workplace pensions and managing employer benefits.
              </p>
            </div>
          </div>

          <div 
            className="rounded-lg border p-4 bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer group transition-colors"
            onClick={() => handleTypeSelect(PensionType.STATE)}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value={PensionType.STATE} id="state" />
                <Landmark className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <Label htmlFor="state" className="font-medium">
                  State Pension
                </Label>
              </div>
              <p className="text-sm text-muted-foreground pl-9">
                Track your government or state pension entitlements. 
                Ideal for monitoring your public pension benefits and 
                planning for retirement income from government sources.
              </p>
            </div>
          </div>
        </RadioGroup>
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedType}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 