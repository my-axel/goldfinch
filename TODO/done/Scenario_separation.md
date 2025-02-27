# Scenario Calculation Separation and Layout Improvement

## 1. Scenario Calculation Separation

### Create Combined Scenario Calculator
- [x] Create new function `calculateCombinedScenarios` in `src/frontend/lib/projection-utils.ts`
  ```typescript
  interface CombinedScenariosInput {
    initialValue: number
    contributionSteps: ContributionStep[]
    rates: {
      pessimistic: number
      realistic: number
      optimistic: number
    }
    startDate: Date
    endDate: Date
    historicalContributions: ContributionHistoryResponse[]
  }

  interface CombinedScenariosOutput {
    scenarios: {
      pessimistic: ProjectionScenario
      realistic: ProjectionScenario
      optimistic: ProjectionScenario
    }
    metadata: {
      totalCalculationTime: number
      dataPoints: number
      startDate: Date
      endDate: Date
      totalContributions: number
      initialValue: number
    }
  }
  ```
  Implementation details:
  - [x] Single loop implementation for all scenarios
    ```typescript
    // Example loop structure
    while (currentDate <= endDate) {
      const contribution = getContributionForDate(currentDate, contributionSteps)
      
      // Calculate all scenarios in one pass
      pessimisticValue = pessimisticValue * (1 + pessimisticRate) + contribution
      realisticValue = realisticValue * (1 + realisticRate) + contribution
      optimisticValue = optimisticValue * (1 + optimisticRate) + contribution
      
      // Store data points for all scenarios at once
      dataPoints.push({
        date: new Date(currentDate),
        pessimistic: { value: pessimisticValue, contribution },
        realistic: { value: realisticValue, contribution },
        optimistic: { value: optimisticValue, contribution }
      })
      
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    ```
  - [x] Shared date calculations and transformations
  - [x] Optimized memory usage through single data structure
  - [x] Performance monitoring with detailed metrics

### Create Shared Hook for Scenario Calculations
- [x] Create new hook `useProjectionScenarios` in `src/frontend/hooks/useProjectionScenarios.ts`
  ```typescript
  function useProjectionScenarios({
    historicalData,
    contributionSteps,
    retirementDate,
    settings
  }: ProjectionScenariosInput) {
    // Implementation
    const [scenarios, setScenarios] = useState<CombinedScenariosOutput | null>(null)
    const [isCalculating, setIsCalculating] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Memoize calculation inputs
    const calculationInputs = useMemo(() => ({
      initialValue: getLastHistoricalValue(historicalData),
      contributionSteps,
      rates: {
        pessimistic: settings.projection_pessimistic_rate,
        realistic: settings.projection_realistic_rate,
        optimistic: settings.projection_optimistic_rate
      },
      startDate: new Date(),
      endDate: retirementDate,
      historicalContributions
    }), [historicalData, contributionSteps, retirementDate, settings])

    // Perform calculation
    useEffect(() => {
      calculateScenarios()
    }, [calculationInputs])

    return { scenarios, isCalculating, error, recalculate }
  }
  ```

### Move and Update Calculation Logic
- [x] Extract calculation functions from `CombinedProjectionChart`
  - [x] Replace three separate `calculateSingleScenarioProjection` calls with single `calculateCombinedScenarios`
  - [x] Keep `calculateSingleScenarioProjection` for individual scenario calculations (e.g., for what-if analysis)
  - [x] Move data transformation logic to the calculator
  - [x] Keep only chart-specific transformations in the chart

- [x] Update types in `src/frontend/types/projection.ts`
  ```typescript
  // New types to add
  interface ScenarioDataPoint {
    value: number
    contribution: number
    accumulatedContribution: number
  }

  interface CombinedDataPoint {
    date: Date
    isHistorical: boolean
    pessimistic: ScenarioDataPoint
    realistic: ScenarioDataPoint
    optimistic: ScenarioDataPoint
  }

  interface PerformanceMetrics {
    totalCalculationTime: number
    dataPoints: number
    averageTimePerPoint: number
  }
  ```

### Update Components
- [x] Modify `CombinedProjectionChart`
  - [x] Remove individual calculation logic
  - [x] Use new hook for combined scenarios
  - [x] Keep only visualization logic
  - [x] KEEP THE CHART VISUALIZATION AS IS - do not modify any Recharts configuration!
  - [x] Add loading state visualization during calculations

- [x] Update `ProjectionScenarioKPIs`
  - [x] Use new hook for scenarios
  - [x] Add loading states with skeleton UI
  - [x] Improve error handling with error boundaries
  - [x] Add optional performance indicators:
    ```typescript
    {scenarios?.metadata.totalCalculationTime > 100 && (
      <ExplanationAlert>
        Calculation took longer than usual ({scenarios.metadata.totalCalculationTime}ms)
      </ExplanationAlert>
    )}
    ```

## 2. Layout and UI Improvements

### Optimize ProjectionExplanations
- [x] Create new `ProjectionRatesSummary` component
  ```typescript
  <ExplanationStats columns={1}>
    <ExplanationStat
      icon={TrendingDown}
      label="Pessimistic Scenario"
      value={`${settings.projection_pessimistic_rate}%`}
      subValue={formatCurrency(scenarios.pessimistic.finalValue)}
      subLabel="at retirement"
    />
    {/* Similar for realistic and optimistic */}
  </ExplanationStats>
  ```
  - [x] Show only rates and brief descriptions
  - [x] Add expandable section for detailed explanations
  - [x] Use ExplanationStats for consistent styling

- [ ] Update existing `ProjectionExplanations`
  - Move detailed content to expandable section
  - Keep calculation method behind info button
  - Update styling to match new layout

### Update Right Column Layout
- [x] Create new layout structure:
  ```tsx
  <div className="space-y-6">
    <ProjectionRatesSummary 
      scenarios={scenarios}
      settings={settings}
      isCalculating={isCalculating}
    />
    <ProjectionScenarioKPIs
      scenarios={scenarios}
      totalContributions={scenarios?.metadata.totalContributions}
      isCalculating={isCalculating}
    />
    <ProjectionExplanations />
  </div>
  ```
  - [x] Add proper spacing (gap-6) between sections
  - [x] Add smooth transitions for loading states
  - [x] Ensure responsive behavior (maintain readability on smaller screens)

### Enhance Visual Hierarchy
- [ ] Update card and text styles
  - Use consistent typography across all components
  - Add visual separation between sections using dividers or spacing
  - Improve information density with proper whitespace
- [ ] Add visual indicators
  - Use consistent color coding for scenarios across all components
  - Add appropriate icons for different sections
  - Implement smooth loading states and transitions

## 3. Performance Optimizations

### Memoization and Caching
- [ ] Add proper memoization to expensive calculations
  ```typescript
  const memoizedScenarios = useMemo(() => 
    calculateCombinedScenarios(inputs), 
    [JSON.stringify(inputs)]
  )
  ```
- [ ] Implement request caching for API calls
- [ ] Add suspense boundaries for loading states

### State Management
- [ ] Review state updates in scenario calculations
  - Ensure calculations don't block the UI
  - Consider using web workers for heavy calculations
- [ ] Optimize re-renders in chart component
  - Use `React.memo` where appropriate
  - Implement proper dependency arrays in hooks
- [ ] Add proper cleanup in hooks
  ```typescript
  useEffect(() => {
    let mounted = true
    // ... calculation logic
    return () => { mounted = false }
  }, [inputs])
  ```

## 4. Testing and Documentation

### Update Documentation
- [x] Add JSDoc comments to new hook
  ```typescript
  /**
   * Hook for calculating projection scenarios
   * @param historicalData - Historical value data points
   * @param contributionSteps - Planned contribution steps
   * @param retirementDate - Target retirement date
   * @param settings - Projection settings with rates
   * @returns Combined scenarios with performance metrics
   */
  ```
- [x] Update component documentation
- [x] Add usage examples
- [x] Document performance considerations

## 5. Migration Plan

### Phase 1: Hook Creation (Day 1)
1. Create and test `useProjectionScenarios`
2. Add proper error handling and loading states
3. Verify calculations match current implementation

### Phase 2: Component Updates (Day 1-2)
1. Update `CombinedProjectionChart` to use new hook
2. Update `ProjectionScenarioKPIs` to use new hook
3. Create new `ProjectionRatesSummary`
4. Test all components in isolation

### Phase 3: Layout Implementation (Day 2)
1. Implement new layout structure
2. Add proper styling and transitions
3. Test responsive behavior
4. Verify performance

### Phase 4: Cleanup and Documentation (Day 2-3)
1. Remove old calculation code
2. Update types and interfaces
3. Complete documentation
4. Add final tests

## Notes

### Current Pain Points to Address
- Duplicate scenario calculations causing performance issues
- Complex, nested component logic making maintenance difficult
- Dense explanatory text reducing readability
- Inconsistent loading states affecting UX

### Expected Benefits
- Better separation of concerns through centralized calculations
- Improved performance with single-loop approach
- More maintainable code with clear interfaces
- Better user experience with consistent loading states
- Consistent styling across all components

### Risk Mitigation
- Implement changes incrementally to avoid breaking existing functionality
- Add comprehensive tests for calculation accuracy
- Maintain backward compatibility with existing APIs
- Document all changes and update component interfaces
- Add performance monitoring to catch regressions 