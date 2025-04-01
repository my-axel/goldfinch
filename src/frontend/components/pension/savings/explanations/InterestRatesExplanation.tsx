import {
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert
} from "@/frontend/components/ui/explanation"

export function InterestRatesExplanation() {
  return (
    <div>
      <p>
        Define different interest rate scenarios to model potential returns on your savings.
        This helps you understand the range of possible outcomes.
      </p>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Pessimistic Rate:</strong> Conservative estimate for lower market performance
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Realistic Rate:</strong> Expected average return based on market conditions
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Optimistic Rate:</strong> Best-case scenario for market performance
        </ExplanationListItem>
      </ExplanationList>
      
      <ExplanationAlert className="mt-4">
        Consider historical market returns and inflation when setting your interest rates.
        The realistic rate is typically between the pessimistic and optimistic rates.
      </ExplanationAlert>
    </div>
  )
} 