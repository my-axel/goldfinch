"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pension, PensionType, ETFPension, InsurancePension, CompanyPension } from "@/types/pension"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Trash2, Pencil, PiggyBank, Building, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { ETFDailyPrice } from "@/types/etf"
import { HouseholdMember } from "@/types/household"
import { formatMemberName } from "@/types/household-helpers"
import { mockEtfs } from "@/data/mockEtfs"

interface PensionListProps {
  pensions: Pension[]
  etfPrices: ETFDailyPrice[]
  members: HouseholdMember[]
  onDelete: (id: string) => void
  onEdit: (pension: Pension) => void
}

const PensionTypeIcons = {
  [PensionType.ETF_PLAN]: PiggyBank,
  [PensionType.INSURANCE]: Shield,
  [PensionType.COMPANY]: Building,
} as const

function ETFPensionContent({ pension, etfPrices }: { pension: ETFPension, etfPrices: ETFDailyPrice[] }) {

  const etf = mockEtfs.find(e => e.id === pension.etf_id)

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
        <dd>{etf ? `${etf.symbol} - ${etf.name}` : 'Unknown ETF'}</dd>
      </div>
    </>
  )
}

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

function PensionCard({ 
  pension, 
  etfPrices, 
  onEdit, 
  onDelete 
}: { 
  pension: Pension
  etfPrices: ETFDailyPrice[]
  onEdit: (pension: Pension) => void
  onDelete: (id: string) => void
}) {
  const Icon = PensionTypeIcons[pension.type]

  const renderContent = () => {
    switch (pension.type) {
      case PensionType.ETF_PLAN:
        return <ETFPensionContent pension={pension} etfPrices={etfPrices} />
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

function MemberPensionGroup({
  member,
  pensions,
  etfPrices,
  onEdit,
  onDelete
}: {
  member: HouseholdMember
  pensions: Pension[]
  etfPrices: ETFDailyPrice[]
  onEdit: (pension: Pension) => void
  onDelete: (id: string) => void
}) {
  const memberPensions = pensions.filter(p => p.member_id === member.id)
  
  if (memberPensions.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{formatMemberName(member)}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {memberPensions.map((pension) => (
          <PensionCard
            key={pension.id}
            pension={pension}
            etfPrices={etfPrices}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

export function PensionList({ pensions, etfPrices, members, onDelete, onEdit }: PensionListProps) {
  const [pensionToDelete, setPensionToDelete] = useState<string | null>(null)

  return (
    <>
      <div className="space-y-8">
        {members.map((member) => (
          <MemberPensionGroup
            key={member.id}
            member={member}
            pensions={pensions}
            etfPrices={etfPrices}
            onEdit={onEdit}
            onDelete={(id) => setPensionToDelete(id)}
          />
        ))}
      </div>

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