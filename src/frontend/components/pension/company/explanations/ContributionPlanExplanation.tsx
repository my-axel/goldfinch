import React from 'react';
import { 
  ExplanationAlert
} from '@/frontend/components/ui/explanation';

export function ContributionPlanExplanation() {
  return (
    <div>
      <p>
        Set up your contribution plan steps to track changes in your
        contribution amount or frequency over time.
      </p>
      <p className="mt-2">
        Each step represents a period with a specific contribution
        amount and frequency.
      </p>
      
      <ExplanationAlert className="mt-4">
        Adding detailed contribution steps helps you track your
        pension growth more accurately.
      </ExplanationAlert>
    </div>
  );
} 