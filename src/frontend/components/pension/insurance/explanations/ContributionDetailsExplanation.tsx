import {
  Explanation,
  ExplanationHeader,
  ExplanationContent,
  ExplanationList,
  ExplanationListItem,
  ExplanationAlert
} from "@/frontend/components/ui/explanation"

export function ContributionDetailsExplanation() {
  return (
    <Explanation>
      <ExplanationHeader>Contributions</ExplanationHeader>
      <ExplanationContent>
        <p>Define your contribution plan with multiple steps for different amounts and frequencies.</p>

        <ExplanationList>
          <ExplanationListItem>Set contribution amount and frequency (monthly to yearly)</ExplanationListItem>
          <ExplanationListItem>Define start and optional end dates for each step</ExplanationListItem>
          <ExplanationListItem>Use one-time contributions for single payments</ExplanationListItem>
        </ExplanationList>

        <ExplanationAlert>
          You can plan future changes in your contribution amount or frequency.
        </ExplanationAlert>
      </ExplanationContent>
    </Explanation>
  )
} 