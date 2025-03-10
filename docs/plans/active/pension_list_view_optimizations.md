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
1. Create new endpoints in the FastAPI backend for lightweight pension data:
   - Path: `/api/v1/pension/etf/list`
   - Path: `/api/v1/pension/company/list`
   - Path: `/api/v1/pension/insurance/list`
   - Method: GET
   - Purpose: Return only essential pension data needed for the list view

2. Implement the ETF pension list endpoint:
   ```python
   @router.get("/list", response_model=List[ETFPensionListSchema])
   async def get_etf_pension_list(
       db: AsyncSession = Depends(get_db),
       current_user: User = Depends(get_current_user),
   ):
       """Get a lightweight list of ETF pensions without detailed data"""
       return await crud.etf_pension.get_list_by_owner(
           db=db, owner_id=current_user.id
       )
   ```

3. Create schemas for the lightweight pension lists:
   ```python
   class ETFPensionListSchema(BaseModel):
       """Lightweight schema for ETF pensions in list view"""
       id: int
       name: str
       type: Literal["etf"] = "etf"
       member_id: Optional[int] = None
       currency: str
       start_date: date
       end_date: Optional[date] = None
       etf_symbol: str
       latest_value: Optional[float] = None
       total_invested: Optional[float] = None
       
   class CompanyPensionListSchema(BaseModel):
       """Lightweight schema for company pensions in list view"""
       id: int
       name: str
       type: Literal["company"] = "company"
       member_id: Optional[int] = None
       currency: str
       start_date: date
       end_date: Optional[date] = None
       company_name: str
       # Add any other essential fields needed for list view
       
   class InsurancePensionListSchema(BaseModel):
       """Lightweight schema for insurance pensions in list view"""
       id: int
       name: str
       type: Literal["insurance"] = "insurance"
       member_id: Optional[int] = None
       currency: str
       start_date: date
       end_date: Optional[date] = None
       insurance_company: str
       current_value: Optional[float] = None
       # Add any other essential fields needed for list view
   ```

4. Modify the ETF pension CRUD to support fetching lightweight list data:
   ```python
   async def get_list_by_owner(
       db: AsyncSession, owner_id: int
   ) -> List[Dict]:
       """Get lightweight ETF pension list data by owner"""
       query = select(
           ETFPension.id,
           ETFPension.name,
           ETFPension.member_id,
           ETFPension.currency,
           ETFPension.start_date,
           ETFPension.end_date,
           ETFPension.etf_symbol,
       ).where(ETFPension.owner_id == owner_id)
       
       result = await db.execute(query)
       pensions = [dict(row) for row in result]
       
       # Add calculated fields but avoid fetching full history
       for pension in pensions:
           pension["type"] = "etf"
           latest = await get_latest_value(db, pension["id"])
           pension["latest_value"] = latest.value if latest else None
           pension["total_invested"] = await get_total_invested(db, pension["id"])
       
       return pensions
   ```

5. Implement similar CRUD methods for company and insurance pensions.

#### Frontend Changes
1. Create API service functions to fetch the lightweight pension lists:
   ```typescript
   // src/frontend/services/pensionService.ts
   export async function getETFPensionList(): Promise<ETFPensionListItem[]> {
     const response = await fetch('/api/v1/pension/etf/list');
     if (!response.ok) {
       throw new Error('Failed to fetch ETF pension list');
     }
     return response.json();
   }
   
   export async function getCompanyPensionList(): Promise<CompanyPensionListItem[]> {
     const response = await fetch('/api/v1/pension/company/list');
     if (!response.ok) {
       throw new Error('Failed to fetch company pension list');
     }
     return response.json();
   }
   
   export async function getInsurancePensionList(): Promise<InsurancePensionListItem[]> {
     const response = await fetch('/api/v1/pension/insurance/list');
     if (!response.ok) {
       throw new Error('Failed to fetch insurance pension list');
     }
     return response.json();
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
     id: number;
     name: string;
     type: 'etf';
     member_id?: number;
     currency: string;
     start_date: string;
     end_date?: string;
     etf_symbol: string;
     latest_value?: number;
     total_invested?: number;
   }
   
   export interface CompanyPensionListItem {
     id: number;
     name: string;
     type: 'company';
     member_id?: number;
     currency: string;
     start_date: string;
     end_date?: string;
     company_name: string;
     // Add other essential fields
   }
   
   export interface InsurancePensionListItem {
     id: number;
     name: string;
     type: 'insurance';
     member_id?: number;
     currency: string;
     start_date: string;
     end_date?: string;
     insurance_company: string;
     current_value?: number;
     // Add other essential fields
   }
   
   export type PensionListItem = 
     | ETFPensionListItem 
     | CompanyPensionListItem 
     | InsurancePensionListItem;
   ```

3. Update the PensionList component to use the new API:
   ```typescript
   // src/frontend/components/pension/shared/PensionList.tsx
   export function PensionList({ members = [], onDelete }: Omit<PensionListProps, 'pensions'>) {
     const [pensions, setPensions] = useState<PensionListItem[]>([]);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     
     useEffect(() => {
       async function fetchPensions() {
         try {
           setIsLoading(true);
           const data = await getAllPensionLists();
           setPensions(data);
         } catch (err) {
           setError('Failed to load pensions');
           console.error(err);
         } finally {
           setIsLoading(false);
         }
       }
       
       fetchPensions();
     }, []);
     
     if (isLoading) return <LoadingState message="Loading Pension List" />;
     if (error) return <ErrorState message={error} />;
     
     // Rest of the component remains the same
     // ...
   }
   ```

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
                 ? formatCurrency(pension.latest_value, { 
                     locale: 'en-US', // Use user settings in real implementation
                     currency: pension.currency 
                   }).formatted
                 : 'N/A'}
             </span>
           </div>
           <div className="flex justify-between">
             <span className="text-sm text-muted-foreground">Total Invested</span>
             <span className="font-medium">
               {pension.total_invested
                 ? formatCurrency(pension.total_invested, { 
                     locale: 'en-US', // Use user settings in real implementation
                     currency: pension.currency 
                   }).formatted
                 : 'N/A'}
             </span>
           </div>
           <div className="flex justify-between">
             <span className="text-sm text-muted-foreground">Symbol</span>
             <span className="font-medium">{pension.etf_symbol}</span>
           </div>
         </div>
       );
     }
     
     // For full data, keep the existing implementation
     // ...existing implementation...
   }
   ```

2. Similarly update the InsurancePensionContent and CompanyPensionContent components to handle both full and lightweight data.

3. Update the PensionCard component to work with both data types:
   ```typescript
   // src/frontend/components/pension/shared/PensionList.tsx
   function PensionCard({ 
     pension, 
     onEdit, 
     onDelete
   }: { 
     pension: Pension | PensionListItem,
     onEdit: (pension: Pension | PensionListItem) => void,
     onDelete: (id: number) => void
   }) {
     // ...existing code...
     
     const renderContent = () => {
       switch (pension.type) {
         case 'etf':
           return <ETFPensionContent pension={pension as (ETFPension | ETFPensionListItem)} />;
         case 'insurance':
           return <InsurancePensionContent pension={pension as (InsurancePension | InsurancePensionListItem)} />;
         case 'company':
           return <CompanyPensionContent pension={pension as (CompanyPension | CompanyPensionListItem)} />;
         default:
           return null;
       }
     };
     
     // ...rest of the component...
   }
   ```

## Testing Plan

1. Verify the new API endpoints return the expected lightweight data
2. Measure and compare loading times before and after the changes
3. Ensure the PensionList displays correctly with the lightweight data
4. Verify that navigating to pension details still loads the complete data
5. Test type compatibility between lightweight and full data structures

## Future Optimizations (For Later)

1. Implement pagination or virtualization for larger pension lists
2. Add caching for frequently accessed ETF data
3. Implement skeleton loading for better perceived performance
4. Optimize backend queries for ETF data retrieval
5. Consider consolidating the three list endpoints into a single endpoint if type compatibility issues are resolved

## Estimated Effort

- Backend changes: 3-4 hours
- Frontend changes: 2-3 hours
- Testing: 1-2 hours
- Total: 6-9 hours 