# Refactoring Tasks

## API Service Extraction

The goal is to move all API calls from contexts into dedicated service files, following the pattern established with `settings.ts`. This will improve code organization, maintainability, and reusability.

### Pension Service
- [ ] Create `src/frontend/services/pension.ts`
  - [ ] Extract all API routes from context
  - [ ] Create typed service methods for:
    - [ ] `getPensions(memberId?: number)`
    - [ ] `getPension(id: number)`
    - [ ] `createEtfPension(pension: Omit<ETFPension, 'id' | 'current_value'>)`
    - [ ] `createInsurancePension(pension: Omit<InsurancePension, 'id' | 'current_value'>)`
    - [ ] `createCompanyPension(pension: Omit<CompanyPension, 'id' | 'current_value'>)`
    - [ ] `updateEtfPension(id: number, pension: Omit<ETFPension, 'id' | 'current_value'>)`
    - [ ] `updateInsurancePension(id: number, pension: Omit<InsurancePension, 'id' | 'current_value'>)`
    - [ ] `updateCompanyPension(id: number, pension: Omit<CompanyPension, 'id' | 'current_value'>)`
    - [ ] `deletePension(id: number)`
    - [ ] `addOneTimeInvestment(pensionId: number, data: { amount: number, investment_date: string, note?: string })`
    - [ ] `realizeHistoricalContributions(pensionId: number)`
    - [ ] `getPensionStatistics(pensionId: number)`
    - [ ] `updatePensionStatus(pensionId: number, status: PensionStatusUpdate)`
- [ ] Update `PensionContext.tsx`
  - [ ] Import and use pension service
  - [ ] Remove direct API calls
  - [ ] Keep state management and data transformation logic
  - [ ] Update error handling to use service responses

### ETF Service
- [ ] Create `src/frontend/services/etf.ts`
  - [ ] Extract all API routes from context
  - [ ] Create typed service methods for:
    - [ ] `getETFs()`
    - [ ] `searchETFs(query: string)`
    - [ ] `addETF(etf: Omit<ETF, 'id'>)`
    - [ ] `updateETF(id: string, etf: Partial<ETF>)`
    - [ ] `deleteETF(id: string)`
    - [ ] `updateETFData(id: string, type: string)`
    - [ ] `getETFStatus(id: string)`
    - [ ] `getETFMetrics(id: string)`
- [ ] Update `ETFContext.tsx`
  - [ ] Import and use ETF service
  - [ ] Remove direct API calls
  - [ ] Keep state management logic
  - [ ] Update error handling to use service responses

### Household Service
- [ ] Create `src/frontend/services/household.ts`
  - [ ] Extract all API routes from context
  - [ ] Create typed service methods for:
    - [ ] `getMembers()`
    - [ ] `addMember(member: HouseholdMemberFormData)`
    - [ ] `updateMember(id: number, member: Partial<HouseholdMemberFormData>)`
    - [ ] `deleteMember(id: number)`
- [ ] Update `HouseholdContext.tsx`
  - [ ] Import and use household service
  - [ ] Remove direct API calls
  - [ ] Keep state management and helper functions
  - [ ] Update error handling to use service responses

### General Tasks
- [ ] Create base service utilities in `src/frontend/services/utils`
  - [ ] Error handling utilities
  - [ ] Response transformation helpers
  - [ ] Type guards and validators
- [ ] Update API route organization
  - [ ] Consider moving routes into respective service files
  - [ ] Or create a more structured route organization
- [ ] Add proper TypeScript documentation
  - [ ] Document all service methods
  - [ ] Document expected errors and handling
  - [ ] Add examples in comments
- [ ] Add unit tests for services
  - [ ] Test all service methods
  - [ ] Test error cases
  - [ ] Test data transformation

### Testing and Validation
- [ ] Create test plan for refactoring
- [ ] Test each service individually
- [ ] Integration testing with contexts
- [ ] Verify all existing functionality works
- [ ] Performance testing
- [ ] Error handling verification

### Documentation Updates
- [ ] Update API documentation
- [ ] Update component documentation
- [ ] Add service architecture documentation
- [ ] Update development guidelines

## Benefits
1. Better separation of concerns
2. Improved code reusability
3. Easier testing and mocking
4. Consistent error handling
5. Better type safety
6. Cleaner context components
7. More maintainable codebase
8. Easier to implement new features 