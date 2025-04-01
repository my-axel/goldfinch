import {
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert
} from "@/frontend/components/ui/explanation"

export function StatementsExplanation() {
  return (
    <div>
      <p>
        Record your savings statements to track the growth of your pension over time.
        Regular updates help you monitor progress towards your retirement goals.
      </p>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Statement Date:</strong> When the balance was recorded
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Balance:</strong> Current value of your savings
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Note:</strong> Additional information about the statement
        </ExplanationListItem>
      </ExplanationList>
      
      <ExplanationAlert className="mt-4">
        Regular statement updates help track your actual returns against projections
        and adjust your savings strategy if needed.
      </ExplanationAlert>
    </div>
  )
} 