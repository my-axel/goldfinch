import React from 'react';
import { 
  ExplanationAlert, 
  ExplanationList, 
  ExplanationListItem 
} from '@/frontend/components/ui/explanation';

/**
 * Explanation Component Template
 * 
 * This is a template for creating explanation components for form sections.
 * Copy this template and customize it for each form section.
 * 
 * File naming convention: src/frontend/components/pension/[type]/explanations/[SectionName]Explanation.tsx
 * Example: src/frontend/components/pension/etf/explanations/BasicInformationExplanation.tsx
 */
export function ExplanationTemplate() {
  return (
    <>
      <p>
        Main explanation text that describes the purpose of this section.
        This should provide context and guidance to help users understand what information is needed.
      </p>
      
      <ExplanationAlert className="mt-4">
        Important information or tips about this section.
        Use this for highlighting key points or warnings.
      </ExplanationAlert>
      
      <ExplanationList className="mt-4">
        <ExplanationListItem>
          <strong>Key Point:</strong> Description of a key point
        </ExplanationListItem>
        <ExplanationListItem>
          <strong>Another Point:</strong> Description of another point
        </ExplanationListItem>
      </ExplanationList>
    </>
  );
} 