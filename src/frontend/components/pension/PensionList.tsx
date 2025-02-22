"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Pension, PensionType, ETFPension, InsurancePension, CompanyPension } from "@/frontend/types/pension"
import { Trash2, Pencil, PiggyBank, Building, Shield, PlusCircle } from "lucide-react"
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
import { getCurrentContributionStep } from '@/frontend/types/pension-helpers'
import { ContributionFrequency } from '@/frontend/types/pension'
import { OneTimeInvestmentModal } from "./OneTimeInvestmentModal"
import { PensionTypeSelectionModal } from "./PensionTypeSelectionModal"
import { useRouter } from "next/navigation"

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
      return String(frequency).toLowerCase()
  }
}

/**
 * Displays ETF pension specific information
 */
function ETFPensionContent({ pension }: { pension: ETFPension }) {
  const [showOneTimeInvestment, setShowOneTimeInvestment] = useState(false)
  const currentStep = getCurrentContributionStep(pension.contribution_plan_steps)

  return (
    <>
      <div>
        <dt className="text-muted-foreground">ETF</dt>
        <dd className="flex items-center">
          {pension.etf?.name || pension.etf_id}
          {!pension.etf && (
            <span className="ml-2 text-xs text-muted-foreground">(Loading ETF details...)</span>
          )}
        </dd>
      </div>
      {currentStep && (
        <div>
          <dt className="text-muted-foreground">Current Contribution</dt>
          <dd>
            {currentStep.amount.toLocaleString('de-DE')} € {formatFrequency(currentStep.frequency)}
          </dd>
        </div>
      )}
      <div>
        <dt className="text-muted-foreground">Total Units</dt>
        <dd>{Number(pension.total_units || 0).toFixed(3)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Current Value</dt>
        <dd>{pension.current_value.toLocaleString('de-DE')} €</dd>
      </div>

      <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOneTimeInvestment(true)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          One-Time Investment
        </Button>
      </div>
      <OneTimeInvestmentModal
        open={showOneTimeInvestment}
        onOpenChange={setShowOneTimeInvestment}
        pensionId={pension.id}
        pensionName={pension.name}
      />
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
      <div>
        <dt className="text-muted-foreground">Current Value</dt>
        <dd>{pension.current_value.toLocaleString('de-DE')} €</dd>
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
        <div>
          <dt className="text-muted-foreground">Current Value</dt>
          <dd>{pension.current_value.toLocaleString('de-DE')} €</dd>
        </div>
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
  const renderIcon = () => {
    switch (pension.type) {
      case PensionType.ETF_PLAN:
        return <PiggyBank className="h-4 w-4" />;
      case PensionType.INSURANCE:
        return <Shield className="h-4 w-4" />;
      case PensionType.COMPANY:
        return <Building className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (!pension) return null;

    switch (pension.type) {
      case PensionType.ETF_PLAN:
        if ('etf_id' in pension) {
          return <ETFPensionContent pension={pension} />
        }
        return null;
      case PensionType.INSURANCE:
        if ('provider' in pension) {
          return <InsurancePensionContent pension={pension} />
        }
        return null;
      case PensionType.COMPANY:
        if ('employer' in pension) {
          return <CompanyPensionContent pension={pension} />
        }
        return null;
      default:
        return null;
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {renderIcon()}
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
          {renderContent()}
        </dl>
      </CardContent>
    </Card>
  )
}

/**
 * Empty card with plus sign to add a new pension for a specific member
 */
function AddPensionCard({ onClick }: { onClick: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center h-full w-full border-dashed cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardContent className="flex flex-col items-center justify-center py-6 w-full">
        <PlusCircle className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Add New Pension Plan</p>
      </CardContent>
    </Card>
  )
}

/**
 * Displays a list of pension plans grouped by household member
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
  const [typeSelectionOpen, setTypeSelectionOpen] = useState(false)
  const memberPensions = pensions.filter(p => p.member_id === member.id)

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{formatMemberName(member)}</h2>
      <div className="grid gap-4 grid-cols-1 min-[800px]:grid-cols-2 min-[1200px]:grid-cols-3 auto-rows-fr">
        {memberPensions.map((pension) => (
          <PensionCard
            key={pension.id}
            pension={pension}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        <AddPensionCard onClick={() => setTypeSelectionOpen(true)} />
      </div>
      <PensionTypeSelectionModal
        open={typeSelectionOpen}
        onOpenChange={setTypeSelectionOpen}
        memberId={member?.id?.toString() || ""}
      />
    </div>
  )
}

/**
 * Main pension list component that displays all pensions grouped by member
 */
export function PensionList({ pensions, members = [], onDelete }: PensionListProps) {
  const router = useRouter()
  const [pensionToDelete, setPensionToDelete] = useState<number | null>(null)

  const handleEdit = (pension: Pension) => {
    const route = `/pension/${pension.type.toLowerCase()}/${pension.id}/edit`
    router.push(route)
  }

  if (!members || members.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No household members found.</p>
        <p className="text-sm">Add your first household member before adding a pension.</p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {members.map((member) => (
          <MemberPensionGroup
            key={member.id}
            member={member}
            pensions={pensions}
            onEdit={handleEdit}
            onDelete={setPensionToDelete}
          />
        ))}
      </div>

      <AlertDialog open={pensionToDelete !== null} onOpenChange={() => setPensionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pension
              plan and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pensionToDelete) {
                  onDelete(pensionToDelete)
                }
                setPensionToDelete(null)
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