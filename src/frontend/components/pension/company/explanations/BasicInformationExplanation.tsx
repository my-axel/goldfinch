import React from 'react';
import { 
  ExplanationList, 
  ExplanationListItem 
} from '@/frontend/components/ui/explanation';

export function BasicInformationExplanation() {
  return (
    <div>
      <p>
        Enter the basic information about your company pension plan.
        The contribution amount and frequency help you track your
        regular investments.
      </p>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Name:</strong> A descriptive name for your pension plan
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Employer:</strong> The company providing the pension plan
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Start Date:</strong> When you joined the pension plan
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Contribution:</strong> Your regular contribution amount and frequency
        </ExplanationListItem>
      </ExplanationList>
    </div>
  );
} 