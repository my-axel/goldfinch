import {
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert
} from "@/frontend/components/ui/explanation"

export function ContributionPlanExplanation() {
  return (
    <div>
      <p>
        Plan your savings contributions over time. You can set up multiple contribution
        steps to reflect changes in your saving capacity.
      </p>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Amount:</strong> How much you plan to save
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Frequency:</strong> How often you make contributions
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Start Date:</strong> When this contribution step begins
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>End Date:</strong> Optional date when this step ends
        </ExplanationListItem>
      </ExplanationList>
      
      <ExplanationAlert className="mt-4">
        Consider setting up increasing contributions over time to match expected
        salary growth and maximize your retirement savings.
      </ExplanationAlert>
    </div>
  )
} 