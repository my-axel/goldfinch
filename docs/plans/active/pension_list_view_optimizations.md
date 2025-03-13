# Pension List View Performance Optimization

## Problem Statement
The PensionList component is experiencing slow loading times due to unnecessary fetching of detailed ETF data when only basic information is needed for the list view. The ETF data fetch (particularly for WLDL.L) is the main bottleneck, containing large amounts of historical data that will only grow over time.

## Root Cause Analysis
After investigation, the specific issue has been identified:

1. In `fetchPensionsOperation` (src/frontend/context/pension/core.tsx), the function makes additional API calls to fetch ETF details for each ETF pension:
   ```typescript
   // Fetch ETF details for ETF pensions
   const etfPensionsWithDetails = await Promise.all(
     etfResponse.map(async (p) => {
       try {
         const etfDetails = await get<ETF>(getETFByIdRoute(p.etf_id))
         // ...
       } catch (err) {
         // ...
       }
     })
   )
   ```

2. This triggers a separate API call to `/api/v1/etf/{etf_id}` for each ETF pension, fetching detailed data including historical prices.

3. The `ETFPensionContent` component then uses this data to display ETF information:
   ```typescript
   <dd className="flex items-center">
     {pension.etf?.name || pension.etf_id}
     {!pension.etf && (
       <span className="ml-2 text-xs text-muted-foreground">(Loading ETF details...)</span>
     )}
   </dd>
   ```

The solution needs to focus on preventing these unnecessary ETF detail fetches when loading the pension list.

## Implementation Plan

### 1. Create Lightweight Pension List API

#### Backend Changes
1. Create new endpoints in the FastAPI backend for lightweight pension data (make sure they are at the top of the file, so the endpoints are available for the frontend to use; specific before general endpoints!)
   - Path: `/api/v1/pension/etf/list`
   - Path: `/api/v1/pension/company/list`
   - Path: `/api/v1/pension/insurance/list`
   - Method: GET
   - Purpose: Return only essential pension data needed for the list view

2. Implement the ETF pension list endpoint:

3. Create schemas for the lightweight pension lists:
   ```python
   class ETFPensionListSchema(BaseModel):
      """Lightweight schema for ETF pensions in list view"""
      #CHECK THE MODEL FOR THE FIELDS
      #CHECK THE PENSIONLIST OPERATION FOR THE FIELDS YOU NEED


   class CompanyPensionListSchema(BaseModel):
       """Lightweight schema for company pensions in list view"""
      #CHECK THE MODEL FOR THE FIELDS
      #CHECK THE PENSIONLIST OPERATION FOR THE FIELDS YOU NEED
       
   class InsurancePensionListSchema(BaseModel):
       """Lightweight schema for insurance pensions in list view"""
      #CHECK THE MODEL FOR THE FIELDS
      #CHECK THE PENSIONLIST OPERATION FOR THE FIELDS YOU NEED
   ```

4. Modify the ETF pension CRUD to support fetching lightweight list data:

5. Implement similar CRUD methods for company and insurance pensions.

#### Frontend Changes
1. Create API service functions to fetch the lightweight pension lists:
   ```typescript
   // src/frontend/services/pensionService.ts
   export async function getETFPensionList(): Promise<ETFPensionListItem[]> {
    ...
   }
   
   export async function getCompanyPensionList(): Promise<CompanyPensionListItem[]> {
    ...
   }
   
   export async function getInsurancePensionList(): Promise<InsurancePensionListItem[]> {
    ...
   }
   
   export async function getAllPensionLists(): Promise<PensionListItem[]> {
     const [etfPensions, companyPensions, insurancePensions] = await Promise.all([
       getETFPensionList(),
       getCompanyPensionList(),
       getInsurancePensionList()
     ]);
     
     return [...etfPensions, ...companyPensions, ...insurancePensions];
   }
   ```

2. Create types for the lightweight pension list items:
   ```typescript
   // src/frontend/types/pension.ts
   export interface ETFPensionListItem {
    // CHECK THE SCHEMA FOR THE FIELDS
   }
   
   export interface CompanyPensionListItem {
    // CHECK THE SCHEMA FOR THE FIELDS
   }
   
   export interface InsurancePensionListItem {
    // CHECK THE SCHEMA FOR THE FIELDS
   }
   
   export type PensionListItem = 
     | ETFPensionListItem 
     | CompanyPensionListItem 
     | InsurancePensionListItem;
   ```

3. Update the PensionList component to use the new API; make sure to check app/pension/page.tsx for the correct usage of the new API endpoints!

### 2. Optimize ETFPensionContent Component

1. Modify the ETFPensionContent component to work with both full and lightweight data:
   ```typescript
   // src/frontend/components/pension/shared/PensionList.tsx
   function ETFPensionContent({ pension }: { 
     pension: ETFPension | ETFPensionListItem
   }) {
     // Check if we're dealing with lightweight data (list view)
     const isLightweight = !('contributions' in pension);
     
     // If lightweight data, render simplified view
     if (isLightweight) {
       return (
         <div className="space-y-2">
           <div className="flex justify-between">
             <span className="text-sm text-muted-foreground">Current Value</span>
             <span className="font-medium">
               {pension.latest_value 
                 ? formatCurrency(pension.latest_value, { // CHECK IF formatCurrency IS WORKING LIKE THIS!
                     locale: 'en-US', // Use user settings in real implementation!!!
                   }).formatted
                 : 'N/A'}
             </span>
           </div>
         </div>
       );
     }
     
     // For full data, keep the existing implementation
     // ...existing implementation...
   }
   ```

2. Similarly update the InsurancePensionContent and CompanyPensionContent components to handle both full and lightweight data.

3. Update the PensionCard component to work with both data types. Make Sure to NOT CHANGE ANY LAYOUT, DESIGN, STYLING, STRUCTURE OR LOGIC!
    <!-- src/frontend/components/pension/shared/PensionList.tsx -->