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

//  TODO: Update id type to match backend primary key type (UUID, int, etc.)

/** 
 * Represents a member of the household. Contains personal information
 * and retirement planning details. Used as the foundation for financial
 * planning calculations.
 * 
 * TODO: Update id type to match backend primary key type (UUID/number)
 * TODO: Add validation decorators for backend ORM (e.g., @Column for TypeORM)
 * TODO: Consider adding created_at and updated_at timestamps
 */
export interface HouseholdMember {
  id: number
  first_name: string
  last_name: string
  birthday: Date
  retirement_age_planned: number    // Age at which member plans to retire
  retirement_age_possible: number    // Earliest possible retirement age
}

// TODO: Add API response types
// export interface ApiResponse<T> {
//   data: T
//   message?: string
//   status: number
// }

/**
 * Extends HouseholdMember with computed fields based on the member's
 * age and retirement plans. These fields are calculated on demand
 * rather than stored in the database.
 * 
 * TODO: Consider moving to a backend DTO (Data Transfer Object)
 * TODO: Add serialization logic for Date objects
 */
export interface HouseholdMemberWithComputedFields extends HouseholdMember {
  age: number                       // Current age
  years_to_retirement_planned: number    // Years until planned retirement
  years_to_retirement_possible: number   // Years until earliest possible retirement
  retirement_year_planned: number        // Calendar year of planned retirement
  retirement_year_possible: number       // Calendar year of earliest possible retirement
}

/**
 * Helper type for creating new household members. Omits system-generated
 * fields like 'id' which are set during creation.
 * 
 * TODO: Add validation schema for API requests
 * TODO: Consider adding backend validation pipe type
 */
export type NewHouseholdMember = Omit<HouseholdMember, 'id'>

// Helper functions for computed fields
export const calculateMemberFields = (member: HouseholdMember): HouseholdMemberWithComputedFields => {
  const today = new Date()
  const age = Math.floor((today.getTime() - member.birthday.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  
  return {
    ...member,
    age,
    years_to_retirement_planned: member.retirement_age_planned - age,
    years_to_retirement_possible: member.retirement_age_possible - age,
    retirement_year_planned: member.retirement_age_planned,
    retirement_year_possible: member.retirement_age_possible
  }
} 