import {
  ProjectionDataPoint,
  ProjectionInput,
  ProjectionResult,
  ProjectionScenario,
  ScenarioType,
  MONTHS_PER_YEAR
} from '../types/projection'

/**
 * Calculates the future value of an investment with regular monthly contributions
 */
export function calculateCompoundInterest(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 100 / MONTHS_PER_YEAR
  const months = years * MONTHS_PER_YEAR
  
  // Future value of current principal
  const futureValue = principal * Math.pow(1 + monthlyRate, months)
  
  // Future value of monthly contributions
  const contributionValue = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  
  return futureValue + contributionValue
}

/**
 * Generates monthly data points for a projection scenario
 */
function generateProjectionDataPoints(
  startDate: Date,
  endDate: Date,
  initialValue: number,
  monthlyContribution: number,
  annualRate: number,
  scenarioType: ScenarioType
): ProjectionDataPoint[] {
  const dataPoints: ProjectionDataPoint[] = []
  const currentDate = new Date(startDate)
  let currentValue = initialValue
  
  while (currentDate <= endDate) {
    const monthlyRate = annualRate / 100 / MONTHS_PER_YEAR
    currentValue = currentValue * (1 + monthlyRate) + monthlyContribution
    
    dataPoints.push({
      date: new Date(currentDate),
      value: currentValue,
      isProjection: true,
      scenarioType,
      contributionAmount: monthlyContribution
    })
    
    currentDate.setMonth(currentDate.getMonth() + 1)
  }
  
  return dataPoints
}

/**
 * Converts historical value data to ProjectionDataPoints
 */
export function convertHistoricalData(
  historicalData: Array<{ date: Date; value: number; contribution?: number }>
): ProjectionDataPoint[] {
  return historicalData.map(point => ({
    date: new Date(point.date),
    value: point.value,
    isProjection: false,
    contributionAmount: point.contribution
  }))
}

/**
 * Calculates projections for all three scenarios
 */
export function calculateProjections(input: ProjectionInput): ProjectionResult {
  const {
    currentValue,
    monthlyContribution,
    startDate,
    endDate,
    rates,
    historicalData = []
  } = input
  
  // Convert historical data if provided
  const convertedHistoricalData = convertHistoricalData(historicalData)
  
  // Calculate projections for each scenario
  const scenarios: Record<ScenarioType, ProjectionScenario> = {
    pessimistic: {
      type: 'pessimistic',
      returnRate: rates.pessimistic,
      dataPoints: generateProjectionDataPoints(
        startDate,
        endDate,
        currentValue,
        monthlyContribution,
        rates.pessimistic,
        'pessimistic'
      ),
      finalValue: 0,
      totalContributions: 0,
      totalReturns: 0
    },
    realistic: {
      type: 'realistic',
      returnRate: rates.realistic,
      dataPoints: generateProjectionDataPoints(
        startDate,
        endDate,
        currentValue,
        monthlyContribution,
        rates.realistic,
        'realistic'
      ),
      finalValue: 0,
      totalContributions: 0,
      totalReturns: 0
    },
    optimistic: {
      type: 'optimistic',
      returnRate: rates.optimistic,
      dataPoints: generateProjectionDataPoints(
        startDate,
        endDate,
        currentValue,
        monthlyContribution,
        rates.optimistic,
        'optimistic'
      ),
      finalValue: 0,
      totalReturns: 0,
      totalContributions: 0
    }
  }
  
  // Calculate final values and totals for each scenario
  Object.values(scenarios).forEach(scenario => {
    const lastPoint = scenario.dataPoints[scenario.dataPoints.length - 1]
    scenario.finalValue = lastPoint.value
    scenario.totalContributions = monthlyContribution * scenario.dataPoints.length
    scenario.totalReturns = lastPoint.value - currentValue - scenario.totalContributions
  })
  
  return {
    historicalData: convertedHistoricalData,
    projections: scenarios,
    metadata: {
      startDate,
      endDate,
      currentValue,
      totalContributions: monthlyContribution * 
        ((endDate.getFullYear() - startDate.getFullYear()) * MONTHS_PER_YEAR +
        (endDate.getMonth() - startDate.getMonth()))
    }
  }
}

/**
 * Merges historical data with projection data, ensuring no gaps or overlaps
 */
export function mergeHistoricalAndProjectionData(
  historicalData: ProjectionDataPoint[],
  projectionData: ProjectionDataPoint[]
): ProjectionDataPoint[] {
  if (historicalData.length === 0) return projectionData
  if (projectionData.length === 0) return historicalData
  
  // Sort both arrays by date
  const sortedHistorical = [...historicalData].sort((a, b) => a.date.getTime() - b.date.getTime())
  const sortedProjection = [...projectionData].sort((a, b) => a.date.getTime() - b.date.getTime())
  
  // Find the transition point
  const lastHistoricalDate = sortedHistorical[sortedHistorical.length - 1].date
  const firstProjectionDate = sortedProjection[0].date
  
  // If there's a gap, interpolate the values
  if (lastHistoricalDate < firstProjectionDate) {
    const lastHistoricalValue = sortedHistorical[sortedHistorical.length - 1].value
    const firstProjectionValue = sortedProjection[0].value
    
    // Add an interpolation point with mid-point value
    const valueDiff = firstProjectionValue - lastHistoricalValue
    const interpolatedValue = lastHistoricalValue + valueDiff * 0.5 // Mid-point interpolation
    
    sortedHistorical.push({
      date: new Date(firstProjectionDate),
      value: interpolatedValue,
      isProjection: false
    })
  }
  
  // Filter out any projection data points that overlap with historical data
  const filteredProjection = sortedProjection.filter(
    point => point.date.getTime() > lastHistoricalDate.getTime()
  )
  
  return [...sortedHistorical, ...filteredProjection]
}

/**
 * Formats a projection value for display
 */
export function formatProjectionValue(
  value: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value)
} 