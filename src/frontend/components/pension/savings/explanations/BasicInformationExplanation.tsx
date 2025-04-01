import {
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert
} from "@/frontend/components/ui/explanation"

export function BasicInformationExplanation() {
  return (
    <div>
      <p>
        Enter the basic information about your savings pension plan. This helps you track
        your savings and monitor growth over time.
      </p>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Name:</strong> A descriptive name for your savings pension
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Start Date:</strong> When you started or will start saving
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Interest Rates:</strong> Expected returns in different scenarios
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Compounding Frequency:</strong> How often interest is calculated
        </ExplanationListItem>
      </ExplanationList>
      
      <ExplanationAlert className="mt-4">
        Setting realistic interest rates helps create more accurate projections for your retirement planning.
      </ExplanationAlert>
    </div>
  )
} 