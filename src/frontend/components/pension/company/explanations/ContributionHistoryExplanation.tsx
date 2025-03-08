import React from 'react';
import { 
  ExplanationAlert, 
  ExplanationList, 
  ExplanationListItem 
} from '@/frontend/components/ui/explanation';

export function ContributionHistoryExplanation() {
  return (
    <div>
      <p>
        View the history of contributions made to your company pension plan.
        This section shows all recorded contributions in chronological order.
      </p>
      
      <ExplanationAlert className="mt-4">
        This is a read-only view of your contribution history. To add new contributions,
        please use the Contribution Plan section.
      </ExplanationAlert>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Date:</strong> When the contribution was made
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Amount:</strong> The contribution amount
        </ExplanationListItem>
      </ExplanationList>
    </div>
  );
} 