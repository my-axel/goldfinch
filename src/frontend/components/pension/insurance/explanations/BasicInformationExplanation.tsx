import {
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert
} from "@/frontend/components/ui/explanation"

export function BasicInformationExplanation() {
  return (
    <div>
        <p>Enter the basic details of your insurance pension plan to identify and track your policy.</p>

        <ExplanationList>
          <ExplanationListItem>Name and provider are required to identify your plan</ExplanationListItem>
          <ExplanationListItem>Start date and retirement date help track your policy timeline</ExplanationListItem>
          <ExplanationListItem>Contract number helps with provider communication</ExplanationListItem>
          <ExplanationListItem>Interest rates define your expected returns</ExplanationListItem>
        </ExplanationList>

        <ExplanationAlert>
          Guaranteed interest must be lower than or equal to expected return.
        </ExplanationAlert>
    </div>
  )
} 