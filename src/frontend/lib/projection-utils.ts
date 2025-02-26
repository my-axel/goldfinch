import {
  ProjectionDataPoint,
  ProjectionScenario,
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