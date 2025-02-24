import { HouseholdMember, HouseholdMemberWithComputedFields } from './household'

/**
 * Calculates age and retirement-related fields for a household member.
 * Uses current date for age calculation and derives retirement years
 * from the member's birthday and retirement ages.
 * 
 * TODO: Consider moving calculation to backend service
 * TODO: Add caching for computed values
 * TODO: Add timezone handling for date calculations
 * 
 * @param member - The base household member data
 * @returns Member data with additional computed fields
 */
export function calculateMemberFields(
  member: HouseholdMember
): HouseholdMemberWithComputedFields {
  const today = new Date()
  const birthday = new Date(member.birthday)
  
  // Calculate current age
  const age = today.getFullYear() - birthday.getFullYear()
  const hasHadBirthdayThisYear = today.getMonth() > birthday.getMonth() || 
    (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate())
  const currentAge = hasHadBirthdayThisYear ? age : age - 1

  // Calculate years to retirement using retirement dates from backend
  const retirement_planned = new Date(member.retirement_date_planned)
  const retirement_possible = new Date(member.retirement_date_possible)
  
  const years_to_retirement_planned = Math.floor((retirement_planned.getTime() - today.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  const years_to_retirement_possible = Math.floor((retirement_possible.getTime() - today.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  
  return {
    ...member,
    age: currentAge,
    years_to_retirement_planned,
    years_to_retirement_possible,
    retirement_year_planned: retirement_planned.getFullYear(),
    retirement_year_possible: retirement_possible.getFullYear()
  }
}

/**
 * Validates retirement ages for a household member.
 * Ensures that possible retirement age is not later than planned
 * retirement age and that both are within reasonable bounds.
 * 
 * TODO: Sync validation rules with backend constraints
 * TODO: Add error messages for API responses
 * TODO: Consider moving constants to shared config
 * 
 * @param member - The member data to validate
 * @returns True if retirement ages are valid
 */
export function validateRetirementAges(member: HouseholdMember): boolean {
  const MIN_RETIREMENT_AGE = 40
  const MAX_RETIREMENT_AGE = 100

  return (
    member.retirement_age_possible >= MIN_RETIREMENT_AGE &&
    member.retirement_age_possible <= MAX_RETIREMENT_AGE &&
    member.retirement_age_planned >= member.retirement_age_possible &&
    member.retirement_age_planned <= MAX_RETIREMENT_AGE
  )
}

/**
 * Formats a member's full name.
 * 
 * TODO: Consider moving to backend for consistent formatting
 * TODO: Add localization support
 * 
 * @param member - The household member
 * @returns Formatted full name
 */
export function formatMemberName(member: HouseholdMember): string {
  return `${member.first_name} ${member.last_name}`
} 