import React from 'react';

interface FormLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * FormLayout component
 * 
 * Creates a flexible grid layout for form sections with consistent spacing.
 * Uses a 12-column grid on desktop and single column on mobile.
 * 
 * @param children - Form sections to render within the layout
 * @param className - Optional additional CSS classes
 */
export function FormLayout({ children, className = '' }: FormLayoutProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 ${className}`}>
      {children}
    </div>
  );
} 