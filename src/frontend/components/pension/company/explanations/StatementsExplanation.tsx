import React from 'react';
import { 
  ExplanationList, 
  ExplanationListItem 
} from '@/frontend/components/ui/explanation';

export function StatementsExplanation() {
  return (
    <div>
      <p>
        Add statements from your pension provider to track the value
        of your pension over time.
      </p>
      <p className="mt-2">
        For each statement, you can add retirement projections that
        show expected benefits at different retirement ages.
      </p>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Statement Date:</strong> When the statement was issued
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Value:</strong> The current value of your pension
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Projections:</strong> Expected retirement benefits
        </ExplanationListItem>
      </ExplanationList>
    </div>
  );
} 