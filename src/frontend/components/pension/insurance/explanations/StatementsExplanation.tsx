import {
  Explanation,
  ExplanationHeader,
  ExplanationContent,
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert
} from "@/frontend/components/ui/explanation"

export function StatementsExplanation() {
  return (
    <Explanation>
      <ExplanationHeader>Statements</ExplanationHeader>
      <ExplanationContent>
        <p>Track your pension value and future projections with periodic statements.</p>
        <ExplanationList>
          <ExplanationListItem>Track costs in amount and percentage</ExplanationListItem>
          <ExplanationListItem>Compare scenarios with and without contributions</ExplanationListItem>
          <ExplanationListItem>View projected retirement value and monthly pension</ExplanationListItem>
        </ExplanationList>

        <ExplanationAlert>
          Statement dates must be in the past with return rates between -10% and +10%.
        </ExplanationAlert>
      </ExplanationContent>
    </Explanation>
  )
}