import {
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert
} from "@/frontend/components/ui/explanation"

export function BasicInformationExplanation() {
  return (
    <div>
      <p>
        Enter the basic information about your state pension plan. This information helps you 
        track your pension entitlements.
      </p>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Name:</strong> A descriptive name for your state pension (e.g., &quot;UK State Pension&quot;)
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Start Date:</strong> When you started contributing to the state pension system
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Notes:</strong> Any additional information about your state pension entitlement
        </ExplanationListItem>
      </ExplanationList>
      
      <ExplanationAlert className="mt-4">
        Your state pension is provided by the government based on your contribution history.
        Unlike private pensions, you don&apos;t typically make direct contributions to a state pension.
      </ExplanationAlert>
    </div>
  )
} 