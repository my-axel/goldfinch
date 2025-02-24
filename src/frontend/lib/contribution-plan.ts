import { ContributionStep, ContributionFrequency } from "@/frontend/types/pension"

/**
 * Generates future contribution dates and amounts based on contribution plan steps
 * @param steps The contribution plan steps
 * @param retirementDate Optional retirement date to project contributions until
 * @returns Array of projected contributions with dates and amounts
 */
export function generateFutureContributions(
  steps: ContributionStep[],
  retirementDate?: Date
) {
  // If there are no steps, return empty array
  if (!steps || steps.length === 0) {
    return []
  }

  const today = new Date()
  
  // Ensure retirement date is a valid Date object
  const maxEndDate = retirementDate instanceof Date 
    ? new Date(retirementDate) 
    : new Date(today.getFullYear() + 5, today.getMonth(), today.getDate())

  const contributions: { date: Date; amount: number }[] = []

  // Helper function to add months to a date
  const addMonths = (date: Date, months: number) => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() + months)
    return newDate
  }

  // Find the last step with a defined end date
  const lastStepWithEndDate = [...steps]
    .reverse()
    .find(step => step.end_date)

  // If no step has an end date and we have a retirement date, use that for all undefined end dates
  const defaultEndDate = retirementDate instanceof Date ? maxEndDate : undefined

  // Process each step
  steps.forEach(step => {
    if (!step.start_date) return // Skip invalid steps

    let currentDate = new Date(step.start_date)
    
    // Determine step end date:
    // 1. Use step's end date if defined
    // 2. Use retirement date if available
    // 3. Use last known end date from other steps
    // 4. Fall back to 5 years if nothing else is available
    const stepEndDate = step.end_date 
      ? new Date(step.end_date)
      : defaultEndDate 
        ? defaultEndDate
        : lastStepWithEndDate?.end_date
          ? new Date(lastStepWithEndDate.end_date)
          : maxEndDate

    while (currentDate <= stepEndDate && currentDate <= maxEndDate) {
      contributions.push({
        date: new Date(currentDate),
        amount: step.amount
      })

      // Calculate next contribution date based on frequency
      switch (step.frequency) {
        case ContributionFrequency.MONTHLY:
          currentDate = addMonths(currentDate, 1)
          break
        case ContributionFrequency.QUARTERLY:
          currentDate = addMonths(currentDate, 3)
          break
        case ContributionFrequency.SEMI_ANNUALLY:
          currentDate = addMonths(currentDate, 6)
          break
        case ContributionFrequency.ANNUALLY:
          currentDate = addMonths(currentDate, 12)
          break
        case ContributionFrequency.ONE_TIME:
          // One-time contributions only happen once
          currentDate = new Date(maxEndDate)
          break
      }
    }
  })

  // Sort contributions by date
  return contributions.sort((a, b) => a.date.getTime() - b.date.getTime())
} 