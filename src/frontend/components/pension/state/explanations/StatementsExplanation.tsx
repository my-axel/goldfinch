import {
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert
} from "@/frontend/components/ui/explanation"

export function StatementsExplanation() {
  return (
    <div>
      <p>
        Add statements from your state pension authority to track your entitlement
        over time and see how your projected benefits change.
      </p>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Statement Date:</strong> When the statement was issued by the pension authority
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Current Monthly Amount:</strong> The monthly benefit you would receive if you claimed now
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Projected Monthly Amount:</strong> The estimated monthly benefit at retirement age
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Current Value:</strong> The estimated capital value of your state pension (optional)
        </ExplanationListItem>
      </ExplanationList>
      
      <ExplanationAlert className="mt-4">
        Recording your state pension statements regularly helps you track changes in your 
        projected benefits and plan more effectively for retirement.
      </ExplanationAlert>
    </div>
  )
} 