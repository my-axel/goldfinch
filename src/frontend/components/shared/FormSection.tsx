import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/frontend/components/ui/card';
import { Explanation, ExplanationHeader, ExplanationContent } from '@/frontend/components/ui/explanation';

interface FormSectionProps {
  title: string;
  description?: string;
  explanation?: React.ReactNode; // Optional explanation
  headerActions?: React.ReactNode; // Optional header actions (badges, buttons, etc.)
  children: React.ReactNode;
  className?: string;
}

/**
 * FormSection component
 * 
 * Creates a section within a form layout with an 8:4 column split.
 * Left side (8 columns): Form fields in a Card component
 * Right side (4 columns): Optional explanation content
 * 
 * @param title - Section title
 * @param description - Optional section description
 * @param explanation - Optional explanation component to render in the right column
 * @param headerActions - Optional actions to display in the header next to the title
 * @param children - Form fields to render in the left column
 * @param className - Optional additional CSS classes for the left column
 */
export function FormSection({ 
  title, 
  description, 
  explanation, 
  headerActions,
  children,
  className = ''
}: FormSectionProps) {
  return (
    <>
      {/* Always 8/12 columns for the form section */}
      <div className={`md:col-span-8 ${className}`}>
        <Card>
          <CardHeader className="pb-7">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {headerActions && (
                <div className="flex items-center space-x-2">
                  {headerActions}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </div>
      
      {/* Explanation column - always 4/12 columns, but content is optional */}
      <div className="md:col-span-4">
        {explanation && (
          <Explanation>
            <ExplanationHeader>{title}</ExplanationHeader>
            <ExplanationContent>
              {explanation}
            </ExplanationContent>
          </Explanation>
        )}
      </div>
    </>
  );
} 