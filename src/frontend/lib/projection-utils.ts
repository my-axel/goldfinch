import {
  ProjectionDataPoint,
  ProjectionScenario,
  CombinedScenariosInput,
  CombinedScenariosOutput,
  ScenarioType,
  MONTHS_PER_YEAR
} from '../types/projection'
import { ContributionStep, ContributionFrequency } from '../types/pension'
import { differenceInMonths } from 'date-fns'

/**
 * Helper function to determine if a contribution should be made on a specific date
 * based on the contribution step's frequency and date range.
 */
function getContributionForDate(date: Date, steps: ContributionStep[]): number {
  // Normalize the date to start of day for comparison
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1);
  
  // Find the applicable step for this date
  const applicableStep = steps.find(step => {
    // Normalize dates for comparison
    const stepStart = new Date(step.start_date.getFullYear(), step.start_date.getMonth(), 1);
    const stepEnd = step.end_date ? new Date(step.end_date.getFullYear(), step.end_date.getMonth() + 1, 0) : undefined;
    
    const isAfterStart = normalizedDate >= stepStart;
    const isBeforeEnd = !stepEnd || normalizedDate <= stepEnd;
    return isAfterStart && isBeforeEnd;
  });

  if (!applicableStep) return 0;

  // For ONE_TIME contributions, only contribute in the same month and year
  if (applicableStep.frequency === ContributionFrequency.ONE_TIME) {
    const isSameMonth = date.getMonth() === applicableStep.start_date.getMonth() &&
                       date.getFullYear() === applicableStep.start_date.getFullYear();
    return isSameMonth ? Number(applicableStep.amount) : 0;
  }

  // Calculate months between start_date and current date
  const monthsSinceStart = differenceInMonths(normalizedDate, new Date(applicableStep.start_date.getFullYear(), applicableStep.start_date.getMonth(), 1));

  // Check if this is a valid contribution month based on frequency
  switch (applicableStep.frequency) {
    case ContributionFrequency.MONTHLY:
      return Number(applicableStep.amount);
    case ContributionFrequency.QUARTERLY:
      return monthsSinceStart % 3 === 0 ? Number(applicableStep.amount) : 0;
    case ContributionFrequency.SEMI_ANNUALLY:
      return monthsSinceStart % 6 === 0 ? Number(applicableStep.amount) : 0;
    case ContributionFrequency.ANNUALLY:
      return monthsSinceStart % 12 === 0 ? Number(applicableStep.amount) : 0;
    default:
      return 0;
  }
}

/**
 * Calculates a single scenario projection with monthly compounding.
 * This is an optimized version for calculating one scenario at a time,
 * useful when we need to calculate scenarios independently or in parallel.
 * 
 * @param params Configuration parameters for the projection calculation
 * @returns ProjectionScenario containing the calculated projection data
 */
export function calculateSingleScenarioProjection(params: {
  initialValue: number;
  contributionSteps: ContributionStep[];
  annualReturnRate: number;
  startDate: Date;
  endDate: Date;
  scenarioType: ScenarioType;
  historicalContributions?: { date: string; amount: number }[];
}): ProjectionScenario {
  const {
    initialValue,
    contributionSteps,
    annualReturnRate,
    startDate,
    endDate,
    scenarioType,
    historicalContributions = []
  } = params;

  const monthlyRate = annualReturnRate / 100 / MONTHS_PER_YEAR;
  const dataPoints: ProjectionDataPoint[] = [];
  let currentValue = initialValue;
  
  // Calculate initial accumulated contributions from historical data
  let accumulatedContributions = historicalContributions.reduce((sum, contribution) => 
    sum + Number(contribution.amount), 0);
    
  const currentDate = new Date(startDate);

  // Calculate monthly compounding until end date
  while (currentDate <= endDate) {
    // Get contribution for this date based on contribution steps
    const contribution = getContributionForDate(currentDate, contributionSteps);
    
    // Apply monthly interest first
    currentValue = currentValue * (1 + monthlyRate);
    
    // Then add contribution
    currentValue += contribution;
    accumulatedContributions += contribution;

    // Record the data point
    dataPoints.push({
      date: new Date(currentDate),
      value: currentValue,
      contributionAmount: contribution,
      accumulatedContributions,
      scenarioType,
      isProjection: true
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Calculate final metrics
  const finalValue = dataPoints[dataPoints.length - 1].value;
  const totalReturns = finalValue - accumulatedContributions - initialValue;

  return {
    type: scenarioType,
    dataPoints,
    returnRate: annualReturnRate,
    finalValue,
    totalContributions: accumulatedContributions,
    totalReturns
  };
}

/**
 * Calculates all three scenarios (pessimistic, realistic, optimistic) in a single pass
 * for better performance. This is the preferred method when calculating multiple scenarios.
 * 
 * @param params Configuration parameters for the combined scenario calculations
 * @returns CombinedScenariosOutput containing all scenarios and metadata
 */
export function calculateCombinedScenarios(params: CombinedScenariosInput): CombinedScenariosOutput {
  const {
    initialValue,
    contributionSteps,
    rates,
    startDate,
    endDate,
    historicalContributions = []
  } = params;

  const startTime = performance.now();

  // Initialize scenario values
  let pessimisticValue = initialValue;
  let realisticValue = initialValue;
  let optimisticValue = initialValue;

  // Calculate monthly rates
  const monthlyRates = {
    pessimistic: rates.pessimistic / 100 / MONTHS_PER_YEAR,
    realistic: rates.realistic / 100 / MONTHS_PER_YEAR,
    optimistic: rates.optimistic / 100 / MONTHS_PER_YEAR
  };

  // Initialize data points arrays for each scenario
  const pessimisticPoints: ProjectionDataPoint[] = [];
  const realisticPoints: ProjectionDataPoint[] = [];
  const optimisticPoints: ProjectionDataPoint[] = [];

  // Calculate initial accumulated contributions from historical data
  let accumulatedContributions = historicalContributions.reduce((sum, contribution) => 
    sum + Number(contribution.amount), 0);

  const currentDate = new Date(startDate);

  // Calculate monthly compounding for all scenarios in a single loop
  while (currentDate < endDate) {
    // Get contribution for this date based on contribution steps
    const contribution = getContributionForDate(currentDate, contributionSteps);
    
    // Apply monthly interest and contribution to all scenarios
    pessimisticValue = pessimisticValue * (1 + monthlyRates.pessimistic) + contribution;
    realisticValue = realisticValue * (1 + monthlyRates.realistic) + contribution;
    optimisticValue = optimisticValue * (1 + monthlyRates.optimistic) + contribution;
    
    // Update accumulated contributions
    accumulatedContributions += contribution;

    // Create data points for all scenarios
    const date = new Date(currentDate);
    
    pessimisticPoints.push({
      date,
      value: pessimisticValue,
      contributionAmount: contribution,
      accumulatedContributions,
      scenarioType: 'pessimistic',
      isProjection: true
    });

    realisticPoints.push({
      date,
      value: realisticValue,
      contributionAmount: contribution,
      accumulatedContributions,
      scenarioType: 'realistic',
      isProjection: true
    });

    optimisticPoints.push({
      date,
      value: optimisticValue,
      contributionAmount: contribution,
      accumulatedContributions,
      scenarioType: 'optimistic',
      isProjection: true
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Always add the final data point with the exact retirement date
  const finalDate = new Date(endDate);
  const finalContribution = getContributionForDate(finalDate, contributionSteps);
  
  // Apply final month's growth and contribution
  pessimisticValue = pessimisticValue * (1 + monthlyRates.pessimistic) + finalContribution;
  realisticValue = realisticValue * (1 + monthlyRates.realistic) + finalContribution;
  optimisticValue = optimisticValue * (1 + monthlyRates.optimistic) + finalContribution;
  
  // Update final accumulated contributions
  accumulatedContributions += finalContribution;

  // Add final data points
  pessimisticPoints.push({
    date: finalDate,
    value: pessimisticValue,
    contributionAmount: finalContribution,
    accumulatedContributions,
    scenarioType: 'pessimistic',
    isProjection: true
  });

  realisticPoints.push({
    date: finalDate,
    value: realisticValue,
    contributionAmount: finalContribution,
    accumulatedContributions,
    scenarioType: 'realistic',
    isProjection: true
  });

  optimisticPoints.push({
    date: finalDate,
    value: optimisticValue,
    contributionAmount: finalContribution,
    accumulatedContributions,
    scenarioType: 'optimistic',
    isProjection: true
  });

  // Calculate final metrics for each scenario
  const scenarios = {
    pessimistic: {
      type: 'pessimistic' as const,
      dataPoints: pessimisticPoints,
      returnRate: rates.pessimistic,
      finalValue: pessimisticValue,
      totalContributions: accumulatedContributions,
      totalReturns: pessimisticValue - accumulatedContributions - initialValue
    },
    realistic: {
      type: 'realistic' as const,
      dataPoints: realisticPoints,
      returnRate: rates.realistic,
      finalValue: realisticValue,
      totalContributions: accumulatedContributions,
      totalReturns: realisticValue - accumulatedContributions - initialValue
    },
    optimistic: {
      type: 'optimistic' as const,
      dataPoints: optimisticPoints,
      returnRate: rates.optimistic,
      finalValue: optimisticValue,
      totalContributions: accumulatedContributions,
      totalReturns: optimisticValue - accumulatedContributions - initialValue
    }
  };

  const endTime = performance.now();
  const totalCalculationTime = endTime - startTime;

  return {
    scenarios,
    metadata: {
      totalCalculationTime,
      dataPoints: pessimisticPoints.length,
      startDate,
      endDate,
      totalContributions: accumulatedContributions,
      initialValue
    }
  };
} 