import React from 'react';
import { FormLayout } from './FormLayout';
import { FormSection } from './FormSection';
import { ExplanationTemplate } from './ExplanationTemplate';

/**
 * Form Usage Example
 * 
 * This is an example of how to use the FormLayout and FormSection components.
 * It demonstrates the recommended structure for pension forms.
 * 
 * Note: This is just an example and not meant to be used directly in production.
 */
export function FormUsageExample() {
  // Mock form object - in real usage, this would come from react-hook-form
  // const mockForm = {};
  
  return (
    <FormLayout>
      {/* Section with explanation */}
      <FormSection
        title="Basic Information"
        description="Enter the basic details of your pension plan"
        explanation={<ExplanationTemplate />}
      >
        <div className="space-y-4">
          {/* This would be your actual form fields */}
          <p>Form fields for basic information would go here</p>
        </div>
      </FormSection>
      
      {/* Section without explanation */}
      <FormSection
        title="Contribution Details"
        description="Set up your contribution plan"
      >
        <div className="space-y-4">
          {/* This would be your actual form fields */}
          <p>Form fields for contribution details would go here</p>
        </div>
      </FormSection>
      
      {/* Additional section with explanation */}
      <FormSection
        title="Performance Metrics"
        description="View and analyze performance data"
        explanation={<ExplanationTemplate />}
      >
        <div className="space-y-4">
          {/* This would be your actual form fields */}
          <p>Form fields for performance metrics would go here</p>
        </div>
      </FormSection>
    </FormLayout>
  );
} 