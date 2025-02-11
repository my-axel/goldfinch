//import { z } from "zod" // We'll add zod for validation later

/**
 * Core interfaces for Household Members
 * 
 * HouseholdMember: Base interface defining the structure of a household member
 * HouseholdMemberWithComputedFields: Extends base interface with calculated fields
 * 
 * The calculateMemberFields helper function computes age and retirement-related
 * fields based on the member's data
 */

// TODO: Update id type to match backend primary key type (UUID, int, etc.)
export interface HouseholdMember {
  id: string  // Might need to change based on backend ID type
  first_name: string
  last_name: string
  birthday: Date
  retirement_age_planned: number
  retirement_age_possible: number
}

// TODO: Add API response types
// export interface ApiResponse<T> {
//   data: T
//   message?: string
//   status: number
// }

// Computed properties interface
export interface HouseholdMemberWithComputedFields extends HouseholdMember {
  age: number
  years_to_planned_retirement: number
  years_to_possible_retirement: number
}

// Helper functions for computed fields
export const calculateMemberFields = (member: HouseholdMember): HouseholdMemberWithComputedFields => {
  const today = new Date()
  const age = Math.floor((today.getTime() - member.birthday.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  
  return {
    ...member,
    age,
    years_to_planned_retirement: member.retirement_age_planned - age,
    years_to_possible_retirement: member.retirement_age_possible - age
  }
} 