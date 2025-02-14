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

/**
 * Props for the PensionList component
 * @property pensions - Array of all pension plans
 * @property members - Array of household members
 * @property onDelete - Callback when a pension is deleted
 * @property onEdit - Callback when a pension is edited
 */
interface PensionListProps {
  pensions: Pension[]
  members?: HouseholdMember[]
  onDelete: (id: number) => void
  onEdit: (pension: Pension) => void
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
 * Displays ETF pension specific information
 */
function ETFPensionContent({ pension }: { pension: ETFPension }) {
  if (!pension.etf) {
    console.error('Missing ETF data in pension:', pension)
    return <div>Error: Missing ETF data</div>
  }

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
 * @param pension - The pension plan to display
 * @param onEdit - Callback when edit button is clicked
 * @param onDelete - Callback when delete button is clicked
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
            <dd>{format(pension.start_date, 'dd. MMMM yyyy', { locale: de })}</dd>
          </div>
          {renderContent()}
        </dl>
      </CardContent>
    </Card>
  )
}

/**
 * Displays pension plans grouped by household member
 * TODO: Add sorting options (by name, value, start date)
 * TODO: Add filtering options (by type, status)
 * TODO: Add summary statistics per member
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
 * TODO: Add total portfolio value
 * TODO: Add pension type distribution chart
 * TODO: Add performance overview
 */
export function PensionList({ pensions, members = [], onDelete, onEdit }: PensionListProps) {
  const [pensionToDelete, setPensionToDelete] = useState<number | null>(null)

  return (
    <>
      <div className="space-y-8">
        {members.length > 0 ? (
          members.map((member) => (
            <MemberPensionGroup
              key={member.id}
              member={member}
              pensions={pensions}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pensions.map((pension) => (
              <PensionCard
                key={pension.id}
                pension={pension}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!pensionToDelete} onOpenChange={() => setPensionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pension plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pensionToDelete) {
                onDelete(pensionToDelete)
                setPensionToDelete(null)
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 