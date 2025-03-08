# Flexible Two-Column Grid Layout for Form Pages with Aligned Explanations

## Overview

This document outlines the pattern for creating form pages with a flexible two-column grid layout where each form section (card) has a corresponding explanation aligned in the adjacent column. This creates a clean, intuitive interface where explanations are positioned directly next to their related form elements.

## Layout Structure

1. **Grid Layout**: Use a 12-column grid with an 8:4 column split
   - Left column (8/12): Contains form cards
   - Right column (4/12): Contains explanations for each card

2. **Row Organization**: Each row contains:
   - A form card in the left column
   - A corresponding explanation in the right column

3. **Flexibility**: The number of rows can vary based on form complexity
   - Simple forms may have 2-3 rows
   - Complex forms may have 5+ rows
   - Each row follows the same 8:4 column split pattern

## Implementation Guidelines

### For New Forms

1. **Page Structure**:
   ```jsx
   <div className="container mx-auto py-10">
     {/* Page header */}
     <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center mb-6">
       <div>
         <h1 className="text-3xl font-bold tracking-tight">Form Title</h1>
         <p className="text-muted-foreground mt-2">Form description</p>
       </div>
       <div className="flex space-x-4">
         {/* Action buttons */}
       </div>
     </div>

     {/* Form content */}
     <Form {...form}>
       <form id="form-id" onSubmit={form.handleSubmit(handleSubmit)}>
         <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
           {/* Row 1: First card and its explanation */}
           <div className="md:col-span-8">
             <Card>
               {/* First form section */}
             </Card>
           </div>
           <div className="md:col-span-4">
             <Explanation>
               {/* Explanation for first section */}
             </Explanation>
           </div>

           {/* Row 2: Second card and its explanation */}
           <div className="md:col-span-8">
             <Card>
               {/* Second form section */}
             </Card>
           </div>
           <div className="md:col-span-4">
             <Explanation>
               {/* Explanation for second section */}
             </Explanation>
           </div>

           {/* Additional rows as needed based on form complexity */}
         </div>
       </form>
     </Form>
   </div>
   ```

2. **Card Structure**:
   ```jsx
   <Card>
     <CardHeader className="pb-7">
       <div className="space-y-1.5">
         <CardTitle>Section Title</CardTitle>
         <CardDescription>Section description</CardDescription>
       </div>
     </CardHeader>
     <CardContent>
       {/* Form fields */}
     </CardContent>
   </Card>
   ```

3. **Explanation Structure**:
   ```jsx
   <Explanation>
     <ExplanationHeader>Section Title</ExplanationHeader>
     <ExplanationContent>
       <p>Explanation text that directly relates to the adjacent form section.</p>
     </ExplanationContent>
     <ExplanationAlert className="mt-4">
       Important information or tips.
     </ExplanationAlert>
     <ExplanationList className="mt-4">
       <ExplanationListItem>
         <strong>Key Point:</strong> Description
       </ExplanationListItem>
     </ExplanationList>
   </Explanation>
   ```

### Reusable Components Approach

For more maintainable code, consider using reusable components:

```jsx
// FormLayout component
function FormLayout({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {children}
    </div>
  )
}

// FormSection component
function FormSection({ title, description, explanation, children }) {
  return (
    <>
      <div className="md:col-span-8">
        <Card>
          <CardHeader className="pb-7">
            <div className="space-y-1.5">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-4">
        <Explanation>
          <ExplanationHeader>{title}</ExplanationHeader>
          <ExplanationContent>
            {explanation}
          </ExplanationContent>
        </Explanation>
      </div>
    </>
  )
}

// Usage example
function PensionForm() {
  return (
    <FormLayout>
      <FormSection
        title="Basic Information"
        description="Enter the basic details of your pension plan"
        explanation={<BasicInformationExplanation />}
      >
        <BasicInformationFields />
      </FormSection>
      
      <FormSection
        title="Contribution Details"
        description="Set up your contribution plan"
        explanation={<ContributionExplanation />}
      >
        <ContributionFields />
      </FormSection>
      
      {/* Additional sections as needed */}
    </FormLayout>
  )
}
```

### For Transforming Existing Forms

1. **Identify Card Sections**: Identify all card components in your form.

2. **Create Grid Layout**: Replace the existing layout with the 12-column grid layout.

3. **Split Form Components**: If your form is a single component that renders multiple cards:
   - Consider splitting it into separate components for each card
   - Or keep the structure but ensure each card can be positioned independently

4. **Create Matching Explanations**: For each card section, create a corresponding explanation component with relevant content.

5. **Align Rows**: Ensure each card and its explanation are in the same row of the grid.

## Best Practices

1. **Consistent Headers**: Use consistent styling for card headers and explanation headers.

2. **Focused Content**: Each explanation should directly relate to its adjacent form section.

3. **Responsive Design**: Ensure the layout works well on mobile (stacked) and desktop (side-by-side).

4. **Accessibility**: Maintain proper heading hierarchy and ensure explanations are associated with their form sections.

5. **Concise Text**: Keep explanations concise and directly relevant to the form fields they describe.

6. **Consistent Spacing**: Maintain consistent spacing (gap-6) between rows for visual harmony.

7. **Flexible Row Count**: Adapt the number of rows based on form complexity, but maintain the 8:4 column split.

By following this pattern, you&apos;ll create a consistent, user-friendly interface where explanations are perfectly aligned with their corresponding form sections, regardless of how simple or complex the form is. 