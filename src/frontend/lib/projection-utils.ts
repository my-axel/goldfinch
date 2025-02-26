import {
  ProjectionDataPoint,
  ProjectionScenario,
  ScenarioType,
  MONTHS_PER_YEAR
} from '../types/projection'


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
  monthlyContribution: number;
  annualReturnRate: number;
  startDate: Date;
  endDate: Date;
  scenarioType: ScenarioType;
  historicalContributions?: { date: string; amount: number }[];
}): ProjectionScenario {
  const {
    initialValue,
    monthlyContribution,
    annualReturnRate,
    startDate,
    endDate,
    scenarioType,
    historicalContributions = []
  } = params;

  const monthlyRate = annualReturnRate / 100 / MONTHS_PER_YEAR;
  const dataPoints: ProjectionDataPoint[] = [];
  let currentValue = initialValue;
  
  // Calculate initial accumulated contributions from historical data, ensuring numeric addition
  let accumulatedContributions = historicalContributions.reduce((sum, contribution) => 
    sum + Number(contribution.amount), 0);
    
  const currentDate = new Date(startDate);

  // Create a map of historical contributions for quick lookup
  const contributionMap = new Map(
    historicalContributions.map(c => [c.date, c.amount])
  );

  // Calculate monthly compounding until end date
  while (currentDate <= endDate) {
    // Get contribution for this month (either from historical data or default monthly)
    const dateKey = currentDate.toISOString().split('T')[0];
    const monthContribution = Number(contributionMap.get(dateKey) ?? monthlyContribution);
    
    // Apply monthly interest first
    currentValue = currentValue * (1 + monthlyRate);
    
    // Then add contribution
    currentValue += monthContribution;
    accumulatedContributions += monthContribution;

    // Record the data point
    dataPoints.push({
      date: new Date(currentDate),
      value: currentValue,
      contributionAmount: monthContribution,
      accumulatedContributions, // Add accumulated contributions to each point
      scenarioType,
      isProjection: true
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Calculate final metrics
  const finalValue = dataPoints[dataPoints.length - 1].value;
  const totalReturns = finalValue - accumulatedContributions - initialValue; // Returns = Final - Contributions - Initial

  return {
    type: scenarioType,
    dataPoints,
    returnRate: annualReturnRate,
    finalValue,
    totalContributions: accumulatedContributions,
    totalReturns
  };
} 