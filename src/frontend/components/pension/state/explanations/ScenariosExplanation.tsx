import {
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert,
  ExplanationContent
} from "@/frontend/components/ui/explanation"

export function ScenariosExplanation() {
  return (
    <div>
      <p>
        The scenarios section shows how your state pension benefits might vary based on different
        retirement ages and economic growth assumptions.
      </p>
      
      <ExplanationContent className="mt-4">
        <p>
          State pensions typically increase over time based on various factors like inflation,
          wage growth, and government policy changes. The projections shown here use different growth
          rate assumptions to help you understand the range of possible outcomes.
        </p>
      </ExplanationContent>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Planned Retirement Age:</strong> Projections based on your set retirement age
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Alternative Retirement Age:</strong> Shows how delaying retirement could increase benefits
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Pessimistic Scenario:</strong> Lower growth rate assumption
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Realistic Scenario:</strong> Expected growth rate based on historical trends
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Optimistic Scenario:</strong> Higher growth rate assumption
        </ExplanationListItem>
      </ExplanationList>
      
      <ExplanationAlert className="mt-4">
        These projections are estimates only and actual benefits may differ based on future
        economic conditions and changes to government pension policies.
      </ExplanationAlert>
    </div>
  )
} 