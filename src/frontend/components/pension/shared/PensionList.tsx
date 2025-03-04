"use client"

/**
 * This component follows the formatting best practices documented in:
 * src/frontend/docs/formatting-best-practices.md
 * 
 * It uses client-side only formatting with useState and useEffect to avoid hydration mismatches.
 */

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
import { useState, useEffect } from "react"
import { HouseholdMember } from "@/frontend/types/household"
import { formatMemberName } from "@/frontend/types/household-helpers"
import { getCurrentContributionStep } from '@/frontend/types/pension-helpers'
import { ContributionFrequency } from '@/frontend/types/pension'
import { OneTimeInvestmentModal } from "../etf/components/OneTimeInvestmentModal"
import { YearlyInvestmentModal } from "../company/YearlyInvestmentModal"
import { Badge } from "@/frontend/components/ui/badge"
import { PensionTypeSelectionModal } from "./dialogs/PensionTypeSelectionModal"
import { useRouter } from "next/navigation"
import { useSettings } from "@/frontend/context/SettingsContext"
import { formatNumber, formatCurrency, formatPercent } from "@/frontend/lib/transforms"
import { getPensionEditRoute } from "@/frontend/lib/routes"
import { useHousehold } from "@/frontend/context/HouseholdContext"
import { formatDisplayDate } from "@/frontend/lib/dateUtils"

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
  const { settings } = useSettings()
  
  // State for formatted values to avoid hydration mismatches
  const [formattedValues, setFormattedValues] = useState({
    contribution: "",
    totalUnits: "",
    currentValue: ""
  })
  
  // Format values client-side only after hydration
  useEffect(() => {
    setFormattedValues({
      contribution: currentStep ? formatCurrency(currentStep.amount, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted : "",
      totalUnits: formatNumber(Number(pension.total_units || 0), {
        locale: settings.number_locale,
        decimals: 3
      }).formatted,
      currentValue: formatCurrency(pension.current_value, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted
    })
  }, [pension, currentStep, settings])

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
            {formattedValues.contribution} {formatFrequency(currentStep.frequency)}
          </dd>
        </div>
      )}
      <div>
        <dt className="text-muted-foreground">Total Units</dt>
        <dd>{formattedValues.totalUnits}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Current Value</dt>
        <dd>{formattedValues.currentValue}</dd>
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
      />
    </>
  )
}

/**
 * Displays insurance pension specific information
 */
function InsurancePensionContent({ pension }: { pension: InsurancePension }) {
  const { settings } = useSettings()
  
  // State for formatted values to avoid hydration mismatches
  const [formattedValues, setFormattedValues] = useState({
    guaranteedInterest: "",
    expectedReturn: "",
    currentValue: ""
  })
  
  // Format values client-side only after hydration
  useEffect(() => {
    setFormattedValues({
      guaranteedInterest: formatPercent(pension.guaranteed_interest, {
        locale: settings.number_locale,
        decimals: 2
      }).formatted,
      expectedReturn: formatPercent(pension.expected_return, {
        locale: settings.number_locale,
        decimals: 2
      }).formatted,
      currentValue: formatCurrency(pension.current_value, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted
    })
  }, [pension, settings])

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
        <dd>{formattedValues.guaranteedInterest}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Expected Return</dt>
        <dd>{formattedValues.expectedReturn}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Current Value</dt>
        <dd>{formattedValues.currentValue}</dd>
      </div>
    </>
  )
}

/**
 * Displays company pension specific information
 */
function CompanyPensionContent({ pension }: { pension: CompanyPension }) {
  const { settings } = useSettings()
  const { members } = useHousehold()
  const currentStep = getCurrentContributionStep(pension.contribution_plan_steps)
  const [showYearlyInvestment, setShowYearlyInvestment] = useState(false)
  const [formattedStatementDate, setFormattedStatementDate] = useState("")
  
  // State for formatted values to avoid hydration mismatches
  const [formattedValues, setFormattedValues] = useState({
    regularContribution: "",
    currentContribution: "",
    projectedPayout: "",
    currentValue: ""
  })
  
  // Find the household member associated with this pension
  const member = members.find(m => m.id === pension.member_id)
  
  // Get the latest statement and its projections if available
  const latestStatement = pension.statements && pension.statements.length > 0 
    ? pension.statements.sort((a, b) => new Date(b.statement_date).getTime() - new Date(a.statement_date).getTime())[0] 
    : undefined
  
  // Get the projection that matches the member's planned retirement age, or fall back to the first one
  const latestProjection = latestStatement?.retirement_projections && latestStatement.retirement_projections.length > 0
    ? (member && latestStatement.retirement_projections.find(p => p.retirement_age === member.retirement_age_planned)) || 
      latestStatement.retirement_projections[0]
    : undefined

  // Format values client-side only after hydration
  useEffect(() => {
    // Format the statement date
    if (latestStatement) {
      setFormattedStatementDate(formatDisplayDate(latestStatement.statement_date, settings.ui_locale));
    }
    
    // Format currency and number values
    setFormattedValues({
      regularContribution: pension.contribution_amount && pension.contribution_frequency 
        ? formatCurrency(pension.contribution_amount, {
            locale: settings.number_locale,
            currency: settings.currency
          }).formatted
        : "",
      currentContribution: currentStep
        ? formatCurrency(currentStep.amount, {
            locale: settings.number_locale,
            currency: settings.currency
          }).formatted
        : "",
      projectedPayout: latestProjection
        ? formatCurrency(latestProjection.monthly_payout, {
            locale: settings.number_locale,
            currency: settings.currency
          }).formatted
        : "",
      currentValue: formatCurrency(pension.current_value, {
        locale: settings.number_locale,
        currency: settings.currency
      }).formatted
    });
  }, [pension, currentStep, latestStatement, latestProjection, settings]);

  return (
    <>
      <div>
        <dt className="text-muted-foreground">Employer</dt>
        <dd>{pension.employer}</dd>
      </div>
      
      {pension.contribution_amount && pension.contribution_frequency && (
        <div>
          <dt className="text-muted-foreground">Regular Contribution</dt>
          <dd>{formattedValues.regularContribution} {formatFrequency(pension.contribution_frequency)}</dd>
        </div>
      )}
      
      {currentStep && (
        <div>
          <dt className="text-muted-foreground">Current Contribution</dt>
          <dd>
            {formattedValues.currentContribution} {formatFrequency(currentStep.frequency)}
          </dd>
        </div>
      )}
      
      {latestProjection && (
        <div>
          <dt className="text-muted-foreground">Projected Monthly Payout</dt>
          <dd>{formattedValues.projectedPayout} at age {latestProjection.retirement_age}</dd>
        </div>
      )}
      
      <div>
        <dt className="text-muted-foreground">Current Value</dt>
        <dd>{formattedValues.currentValue}</dd>
      </div>
      
      {latestStatement && (
        <div>
          <dt className="text-muted-foreground">Latest Statement</dt>
          <dd>{formattedStatementDate}</dd>
        </div>
      )}

      {pension.status !== 'PAUSED' && (
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowYearlyInvestment(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Yearly Investment
          </Button>
        </div>
      )}
      <YearlyInvestmentModal
        open={showYearlyInvestment}
        onOpenChange={setShowYearlyInvestment}
        pensionId={pension.id}
        pensionName={pension.name}
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
  onDelete 
}: { 
  pension: Pension
  onEdit: (pension: Pension) => void
  onDelete: (id: number) => void
}) {
  const isInactive = pension.status === 'PAUSED';
  
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
function sortPensions(a: Pension, b: Pension): number {
  // First sort by type
  const typeOrder = {
    [PensionType.ETF_PLAN]: 1,
    [PensionType.COMPANY]: 2,
    [PensionType.INSURANCE]: 3
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
  pensions: Pension[]
  onEdit: (pension: Pension) => void
  onDelete: (id: number) => void
}) {
  const [typeSelectionOpen, setTypeSelectionOpen] = useState(false)
  const memberPensions = pensions
    .filter(p => p.member_id === member.id)
    .sort(sortPensions)

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{formatMemberName(member)}</h2>
      <div className="flex flex-wrap gap-4">
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
    router.push(getPensionEditRoute(pension.type, pension.id))
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