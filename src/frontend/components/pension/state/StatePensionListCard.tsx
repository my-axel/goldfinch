"use client"

import { StatePensionList } from '@/frontend/types/pension'
import { PensionType } from '@/frontend/types/pension'
import { 
  FormattedCurrency, 
  FormattedDate 
} from '@/frontend/components/shared/formatting'

/**
 * Displays state pension specific information
 */
export function StatePensionListCard({ pension }: { pension: StatePensionList & { type: PensionType.STATE } }) {
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
      
      {pension.latest_monthly_amount !== undefined && (
        <div>
          <dt className="text-muted-foreground">Monthly Amount</dt>
          <dd>
            <FormattedCurrency value={pension.latest_monthly_amount} />
          </dd>
        </div>
      )}
      
      {pension.latest_projected_amount !== undefined && (
        <div>
          <dt className="text-muted-foreground">Projected Monthly</dt>
          <dd>
            <FormattedCurrency value={pension.latest_projected_amount} />
          </dd>
        </div>
      )}
      
      {pension.latest_current_value !== undefined && (
        <div>
          <dt className="text-muted-foreground">Current Value</dt>
          <dd>
            <FormattedCurrency value={pension.latest_current_value} />
          </dd>
        </div>
      )}
      
      <div>
        <dt className="text-muted-foreground">Start Date</dt>
        <dd>
          <FormattedDate value={pension.start_date} />
        </dd>
      </div>
    </>
  )
} 