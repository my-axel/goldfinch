"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Pension, PensionType, ETFPension, InsurancePension, CompanyPension } from "@/frontend/types/pension"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Trash2, Pencil, PiggyBank, Building, Shield } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/frontend/components/ui/alert-dialog"
import { useState } from "react"
import { HouseholdMember } from "@/frontend/types/household"
import { formatMemberName } from "@/frontend/types/household-helpers"
import { PensionDialogRouter } from "./PensionDialogRouter"
import { getCurrentContributionStep } from '@/frontend/types/pension-helpers'
import { ContributionFrequency } from '@/frontend/types/pension'

interface DialogState {
  open: boolean
  mode: "add" | "edit"
  pension?: Pension
}

/**
 * Props for the PensionList component
 * @property pensions - Array of all pension plans
 * @property members - Array of household members
 * @property onDelete - Callback when a pension is deleted
 */
interface PensionListProps {
  pensions: Pension[]
  members?: HouseholdMember[]
  onDelete: (id: number) => void
}

/**
 * Mapping of pension types to their respective icons
 */
const PensionTypeIcons = {
  [PensionType.ETF_PLAN]: PiggyBank,
  [PensionType.INSURANCE]: Shield,
  [PensionType.COMPANY]: Building,
} as const

/**
 * Formats the contribution frequency in a human-readable way
 */
function formatFrequency(frequency: ContributionFrequency): string {
  switch (frequency) {
    case ContributionFrequency.MONTHLY:
      return 'monthly'
    case ContributionFrequency.QUARTERLY:
      return 'quarterly'
    case ContributionFrequency.SEMI_ANNUALLY:
      return 'semi-annually'
    case ContributionFrequency.ANNUALLY:
      return 'annually'
    case ContributionFrequency.ONE_TIME:
      return 'one-time'
    default:
      return frequency.toLowerCase()
  }
}

/**
 * Displays ETF pension specific information
 */
function ETFPensionContent({ pension }: { pension: ETFPension }) {
  if (!pension.etf) {
    console.error('Missing ETF data in pension:', pension)
    return <div>Error: Missing ETF data</div>
  }

  const currentStep = getCurrentContributionStep(pension.contribution_plan)

  return (
    <>
      <div>
        <dt className="text-muted-foreground">Initial Investment</dt>
        <dd>{pension.initial_capital.toLocaleString('de-DE')} €</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Current Value</dt>
        <dd>{pension.current_value.toLocaleString('de-DE')} €</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">ETF</dt>
        <dd>{`${pension.etf.symbol} - ${pension.etf.name}`}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Last Price</dt>
        <dd>{pension.etf.last_price.toLocaleString('de-DE')} {pension.etf.currency}</dd>
      </div>
      {currentStep && (
        <div>
          <dt className="text-muted-foreground">Current Contribution</dt>
          <dd>{currentStep.amount.toLocaleString('de-DE')} € {formatFrequency(currentStep.frequency)}</dd>
        </div>
      )}
    </>
  )
}

/**
 * Displays insurance pension specific information
 * TODO: Add expected value calculation
 */
function InsurancePensionContent({ pension }: { pension: InsurancePension }) {
  return (
    <>
      <div>
        <dt className="text-muted-foreground">Provider</dt>
        <dd>{pension.provider}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Contract Number</dt>
        <dd>{pension.contract_number}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Guaranteed Interest</dt>
        <dd>{(pension.guaranteed_interest * 100).toFixed(2)}%</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Expected Return</dt>
        <dd>{(pension.expected_return * 100).toFixed(2)}%</dd>
      </div>
    </>
  )
}

/**
 * Displays company pension specific information
 * TODO: Add vesting period progress
 * TODO: Add employer contribution calculation
 */
function CompanyPensionContent({ pension }: { pension: CompanyPension }) {
  return (
    <>
      <div>
        <dt className="text-muted-foreground">Employer</dt>
        <dd>{pension.employer}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Vesting Period</dt>
        <dd>{pension.vesting_period} years</dd>
      </div>
      {pension.matching_percentage && (
        <div>
          <dt className="text-muted-foreground">Employer Match</dt>
          <dd>{pension.matching_percentage}% up to {
            pension.max_employer_contribution?.toLocaleString('de-DE')
          } €</dd>
        </div>
      )}
    </>
  )
}

/**
 * Displays a single pension plan card with type-specific content
 */
function PensionCard({ 
  pension, 
  onEdit, 
  onDelete 
}: { 
  pension: Pension
  onEdit: (pension: Pension) => void
  onDelete: (id: number) => void
}) {
  const Icon = PensionTypeIcons[pension.type]

  const renderContent = () => {
    switch (pension.type) {
      case PensionType.ETF_PLAN:
        return <ETFPensionContent pension={pension} />
      case PensionType.INSURANCE:
        return <InsurancePensionContent pension={pension} />
      case PensionType.COMPANY:
        return <CompanyPensionContent pension={pension} />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <div>
            <CardTitle>{pension.name}</CardTitle>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(pension)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(pension.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Start Date</dt>
            <dd>{format(new Date(pension.start_date), 'dd. MMMM yyyy', { locale: de })}</dd>
          </div>
          {renderContent()}
        </dl>
      </CardContent>
    </Card>
  )
}

/**
 * Displays pension plans grouped by household member
 */
function MemberPensionGroup({
  member,
  pensions,
  onEdit,
  onDelete
}: {
  member: HouseholdMember
  pensions: Pension[]
  onEdit: (pension: Pension) => void
  onDelete: (id: number) => void
}) {
  const memberPensions = pensions.filter(p => p.member_id === parseInt(member.id.toString()))
  
  if (memberPensions.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{formatMemberName(member)}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {memberPensions.map((pension) => (
          <PensionCard
            key={pension.id}
            pension={pension}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Main component for displaying all pension plans
 * Organizes pensions by household member and handles delete confirmation
 */
export function PensionList({ pensions, members = [], onDelete }: PensionListProps) {
  const [pensionToDelete, setPensionToDelete] = useState<number | null>(null)
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: "add"
  })

  const handleEdit = (pension: Pension) => {
    setDialog({
      open: true,
      mode: "edit",
      pension
    })
  }

  const handleCloseDialog = () => {
    setDialog(prev => ({
      ...prev,
      open: false
    }))
  }

  return (
    <>
      <div className="space-y-8">
        {members.length > 0 ? (
          members.map((member) => (
            <MemberPensionGroup
              key={member.id}
              member={member}
              pensions={pensions}
              onEdit={handleEdit}
              onDelete={setPensionToDelete}
            />
          ))
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pensions.map((pension) => (
              <PensionCard
                key={pension.id}
                pension={pension}
                onEdit={handleEdit}
                onDelete={setPensionToDelete}
              />
            ))}
          </div>
        )}
      </div>

      <PensionDialogRouter
        open={dialog.open}
        onOpenChange={handleCloseDialog}
        mode={dialog.mode}
        pension={dialog.pension}
      />

      <AlertDialog open={!!pensionToDelete} onOpenChange={() => setPensionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pension Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pension plan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pensionToDelete) {
                  onDelete(pensionToDelete)
                  setPensionToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 