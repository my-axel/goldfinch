"use client"

/**
 * This component follows the formatting best practices documented in:
 * docs/frontend/guides/formatting-best-practices.md
 * 
 * It uses client-side only formatting with useState and useEffect to avoid hydration mismatches.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { 
  PensionType, 
  ETFPensionList, 
  InsurancePensionList, 
  CompanyPensionList,
  PensionList as PensionListType,
  SavingsPensionList
} from "@/frontend/types/pension"
import { Trash2, Pencil, Building, Shield, PlusCircle, Landmark, Coins, LineChart } from "lucide-react"
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
import { OneTimeInvestmentModal } from "../shared/OneTimeInvestmentModal"
import { Badge } from "@/frontend/components/ui/badge"
import { PensionTypeSelectionModal } from "./dialogs/PensionTypeSelectionModal"
import { useRouter } from "next/navigation"
import { getPensionEditRoute } from "@/frontend/lib/routes"
import { needsValueCalculation } from "@/frontend/lib/pensionUtils"
import { Loader2 } from "lucide-react"

// Import the formatting components
import { 
  FormattedCurrency, 
  FormattedNumber, 
  FormattedPercent, 
  FormattedDate,
  FormattedFrequency
} from "@/frontend/components/shared/formatting"

import { StatePensionListCard } from '@/frontend/components/pension/state/StatePensionListCard'

/**
 * Props for the PensionList component
 * @property pensions - Array of all pension plans
 * @property members - Array of household members
 * @property onDelete - Callback when a pension is deleted
 */
interface PensionListProps {
  pensions: PensionListType[]
  members?: HouseholdMember[]
  onDelete: (id: number) => void
}

/**
 * Displays ETF pension specific information
 */
function ETFPensionContent({ pension }: { pension: ETFPensionList & { type: PensionType.ETF_PLAN } }) {
  const [showOneTimeInvestment, setShowOneTimeInvestment] = useState(false)
  
  return (
    <>
      <div>
        <dt className="text-muted-foreground">ETF</dt>
        <dd className="flex items-center">
          {pension.etf_name || pension.etf_id}
        </dd>
      </div>
      {pension.current_step_amount && pension.current_step_frequency && (
        <div>
          <dt className="text-muted-foreground">Current Contribution</dt>
          <dd>
            <FormattedCurrency value={pension.current_step_amount} /> <FormattedFrequency value={pension.current_step_frequency} />
          </dd>
        </div>
      )}
      <div>
        <dt className="text-muted-foreground">Total Units</dt>
        <dd><FormattedNumber value={Number(pension.total_units || 0)} decimals={3} /></dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Current Value</dt>
        <dd>
          {needsValueCalculation(pension) ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Currently calculating...</span>
            </div>
          ) : (
            <FormattedCurrency value={pension.current_value} />
          )}
        </dd>
      </div>

      {pension.status !== 'PAUSED' && (
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
      )}
      <OneTimeInvestmentModal
        open={showOneTimeInvestment}
        onOpenChange={setShowOneTimeInvestment}
        pensionId={pension.id}
        pensionName={pension.name}
        pensionType={PensionType.ETF_PLAN}
      />
    </>
  )
}

/**
 * Displays insurance pension specific information
 */
function InsurancePensionContent({ pension }: { pension: InsurancePensionList & { type: PensionType.INSURANCE } }) {
  const [showOneTimeInvestment, setShowOneTimeInvestment] = useState(false)
  
  return (
    <>
      <div>
        <dt className="text-muted-foreground">Provider</dt>
        <dd>{pension.provider}</dd>
      </div>
      {pension.contract_number && (
        <div>
          <dt className="text-muted-foreground">Contract Number</dt>
          <dd>{pension.contract_number}</dd>
        </div>
      )}
      {pension.guaranteed_interest && (
        <div>
          <dt className="text-muted-foreground">Guaranteed Interest</dt>
          <dd><FormattedPercent value={pension.guaranteed_interest} decimals={1} /></dd>
      </div>
      )}
      {pension.expected_return && (
        <div>
          <dt className="text-muted-foreground">Expected Return</dt>
          <dd><FormattedPercent value={pension.expected_return} decimals={1} /></dd>
        </div>
      )}
      <div>
        <dt className="text-muted-foreground">Current Value</dt>
        <dd><FormattedCurrency value={pension.current_value} /></dd>
      </div>
      
      {pension.status !== 'PAUSED' && (
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
      )}
      <OneTimeInvestmentModal
        open={showOneTimeInvestment}
        onOpenChange={setShowOneTimeInvestment}
        pensionId={pension.id}
        pensionName={pension.name}
        pensionType={PensionType.INSURANCE}
      />
    </>
  )
}

/**
 * Displays company pension specific information
 */
function CompanyPensionContent({ 
  pension,
  member 
}: { 
  pension: CompanyPensionList & { type: PensionType.COMPANY }
  member?: HouseholdMember
}) {
  const [showOneTimeInvestment, setShowOneTimeInvestment] = useState(false)
  
  // Get the latest projections if available
  const latestProjections = pension.latest_projections || []
  
  // Get the projection that matches the member's planned retirement age, or fall back to the first one
  const latestProjection = latestProjections.length > 0
    ? (member && latestProjections.find(p => p.retirement_age === member.retirement_age_planned)) || 
      latestProjections[0]
    : undefined

  return (
    <>
      <div>
        <dt className="text-muted-foreground">Employer</dt>
        <dd>{pension.employer}</dd>
      </div>
      
      {pension.contribution_amount && pension.contribution_frequency && (
        <div>
          <dt className="text-muted-foreground">Regular Contribution</dt>
          <dd>
            <FormattedCurrency value={pension.contribution_amount} /> <FormattedFrequency value={pension.contribution_frequency} />
          </dd>
        </div>
      )}
      
      {pension.current_step_amount && pension.current_step_frequency && (
        <div>
          <dt className="text-muted-foreground">Current Own Contribution</dt>
          <dd>
            <FormattedCurrency value={pension.current_step_amount} /> <FormattedFrequency value={pension.current_step_frequency} />
          </dd>
        </div>
      )}
      
      {latestProjection && (
        <div>
          <dt className="text-muted-foreground">Projected Monthly Payout</dt>
          <dd>
            <FormattedCurrency value={latestProjection.monthly_payout} /> at age {latestProjection.retirement_age}
          </dd>
        </div>
      )}
      
      {pension.latest_statement_date && (
        <div>
          <dt className="text-muted-foreground">Latest Statement</dt>
          <dd>
            <FormattedDate value={pension.latest_statement_date} />
          </dd>
        </div>
      )}

      {pension.status !== 'PAUSED' && (
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
      )}
      <OneTimeInvestmentModal
        open={showOneTimeInvestment}
        onOpenChange={setShowOneTimeInvestment}
        pensionId={pension.id}
        pensionName={pension.name}
        pensionType={PensionType.COMPANY}
      />
    </>
  )
}

/**
 * Displays savings pension specific information
 */
function SavingsPensionContent({ pension }: { pension: SavingsPensionList & { type: PensionType.SAVINGS } }) {
  const [showOneTimeInvestment, setShowOneTimeInvestment] = useState(false)
  
  return (
    <>
      {pension.latest_statement_date && (
        <div>
          <dt className="text-muted-foreground">Latest Statement</dt>
          <dd>
            <FormattedDate value={pension.latest_statement_date} />
          </dd>
        </div>
      )}
      
      <div>
        <dt className="text-muted-foreground">Current Balance</dt>
        <dd>
          <FormattedCurrency value={pension.latest_balance || 0} />
        </dd>
      </div>
      
      <div>
        <dt className="text-muted-foreground">Interest Rate</dt>
        <dd>
          <FormattedPercent value={pension.realistic_rate} decimals={1} />
        </dd>
      </div>
      
      {pension.current_step_amount && pension.current_step_frequency && (
        <div>
          <dt className="text-muted-foreground">Regular Contribution</dt>
          <dd>
            <FormattedCurrency value={pension.current_step_amount} /> <FormattedFrequency value={pension.current_step_frequency} />
          </dd>
        </div>
      )}
      
      {pension.status !== 'PAUSED' && (
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
      )}
      <OneTimeInvestmentModal
        open={showOneTimeInvestment}
        onOpenChange={setShowOneTimeInvestment}
        pensionId={pension.id}
        pensionName={pension.name}
        pensionType={PensionType.SAVINGS}
      />
    </>
  )
}

/**
 * Displays a single pension plan card with type-specific content
 */
function PensionCard({ 
  pension, 
  onEdit, 
  onDelete,
  member
}: { 
  pension: PensionListType
  onEdit: (pension: PensionListType) => void
  onDelete: (id: number) => void
  member?: HouseholdMember
}) {
  const isInactive = pension.status === 'PAUSED';
  
  const renderIcon = () => {
    switch (pension.type) {
      case PensionType.ETF_PLAN:
        return <LineChart className="h-4 w-4" />;
      case PensionType.INSURANCE:
        return <Shield className="h-4 w-4" />;
      case PensionType.COMPANY:
        return <Building className="h-4 w-4" />;
      case PensionType.STATE:
        return <Landmark className="h-4 w-4" />;
      case PensionType.SAVINGS:
        return <Coins className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (pension.type) {
      case PensionType.ETF_PLAN:
        return <ETFPensionContent pension={pension} />
      case PensionType.INSURANCE:
        return <InsurancePensionContent pension={pension} />
      case PensionType.COMPANY:
        return <CompanyPensionContent pension={pension} member={member} />
      case PensionType.STATE:
        return <StatePensionListCard pension={pension} />
      case PensionType.SAVINGS:
        return <SavingsPensionContent pension={pension} />
      default:
        return null
    }
  }

  return (
    <Card className={`w-[270px] ${isInactive ? 'bg-muted/20' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {renderIcon()}
          <div>
            <CardTitle className={`flex items-center gap-2 ${isInactive ? 'text-muted-foreground' : ''}`}>
              {pension.name}
              {isInactive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </CardTitle>
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
      <CardContent className={isInactive ? 'text-muted-foreground' : ''}>
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
    <Card className="flex flex-col items-center justify-center w-[270px] border-dashed cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardContent className="flex flex-col items-center justify-center py-6 w-full h-full">
        <PlusCircle className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Add New Pension Plan</p>
      </CardContent>
    </Card>
  )
}

/**
 * Sorts pensions by type and name
 */
function sortPensions(a: PensionListType, b: PensionListType): number {
  // First sort by type
  const typeOrder = {
    [PensionType.STATE]: 1,
    [PensionType.COMPANY]: 2,
    [PensionType.INSURANCE]: 3,
    [PensionType.ETF_PLAN]: 4,
    [PensionType.SAVINGS]: 5,
  }
  
  const typeComparison = typeOrder[a.type] - typeOrder[b.type]
  if (typeComparison !== 0) return typeComparison

  // Then sort by name
  return a.name.localeCompare(b.name)
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
  pensions: PensionListType[]
  onEdit: (pension: PensionListType) => void
  onDelete: (id: number) => void
}) {
  const [typeSelectionOpen, setTypeSelectionOpen] = useState(false)
  const memberPensions = pensions
    .filter(p => p.member_id === member.id)
    .sort(sortPensions)

  return (
    <div key={member.id} className="space-y-4">
      <h2 className="text-lg font-semibold">{formatMemberName(member)}</h2>
      <div className="flex flex-wrap gap-4">
        {memberPensions.map((pension) => (
          <PensionCard 
            key={pension.id} 
            pension={pension} 
            onEdit={onEdit} 
            onDelete={onDelete}
            member={member}
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

  const handleEdit = (pension: PensionListType) => {
    router.push(getPensionEditRoute(pension.type, pension.id))
  }

  // Only show the no members message if we're sure there are no members
  // This prevents flickering during loading
  if (!members || members.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p className="text-lg font-medium mb-2">No household members found.</p>
        <p className="text-sm mb-4">Add your first household member before adding a pension.</p>
        <Button 
          variant="outline" 
          onClick={() => router.push('/household')}
        >
          Go to Household Management
        </Button>
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