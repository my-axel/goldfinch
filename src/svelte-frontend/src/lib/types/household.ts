// Types matching the backend API response
export interface HouseholdMember {
	id: number;
	first_name: string;
	last_name: string;
	birthday: string; // "YYYY-MM-DD"
	retirement_age_planned: number;
	retirement_age_possible: number;
	retirement_date_planned: string; // "YYYY-MM-DD"
	retirement_date_possible: string; // "YYYY-MM-DD"
}

export interface HouseholdMemberWithComputed extends HouseholdMember {
	age: number;
	years_to_retirement_planned: number;
	years_to_retirement_possible: number;
	retirement_year_planned: number;
	retirement_year_possible: number;
}

// Form data — no id, no computed retirement dates
export interface HouseholdMemberFormData {
	first_name: string;
	last_name: string;
	birthday: string; // "YYYY-MM-DD" from <input type="date">
	retirement_age_planned: number;
	retirement_age_possible: number;
}

// Computed fields for display
export function calculateMemberFields(member: HouseholdMember): HouseholdMemberWithComputed {
	const today = new Date();
	const birthday = new Date(member.birthday);

	const ageYear = today.getFullYear() - birthday.getFullYear();
	const hadBirthday =
		today.getMonth() > birthday.getMonth() ||
		(today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate());
	const age = hadBirthday ? ageYear : ageYear - 1;

	const retPlanned = new Date(member.retirement_date_planned);
	const retPossible = new Date(member.retirement_date_possible);
	const msPerYear = 365.25 * 24 * 60 * 60 * 1000;

	return {
		...member,
		age,
		years_to_retirement_planned: Math.max(
			0,
			Math.floor((retPlanned.getTime() - today.getTime()) / msPerYear)
		),
		years_to_retirement_possible: Math.max(
			0,
			Math.floor((retPossible.getTime() - today.getTime()) / msPerYear)
		),
		retirement_year_planned: retPlanned.getFullYear(),
		retirement_year_possible: retPossible.getFullYear()
	};
}

export function formatMemberName(member: HouseholdMember): string {
	return `${member.first_name} ${member.last_name}`;
}

// Validation
export interface ValidationErrors {
	first_name?: string;
	last_name?: string;
	birthday?: string;
	retirement_age_planned?: string;
	retirement_age_possible?: string;
}

import { m } from '$lib/paraglide/messages.js';

export function validateMemberForm(data: HouseholdMemberFormData): ValidationErrors {
	const errors: ValidationErrors = {};

	if (!data.first_name.trim()) errors.first_name = m.household_first_name_required();
	if (!data.last_name.trim()) errors.last_name = m.household_last_name_required();
	if (!data.birthday) errors.birthday = m.household_birthday_required();

	if (data.retirement_age_planned < 40 || data.retirement_age_planned > 100)
		errors.retirement_age_planned = m.household_must_be_between();
	if (data.retirement_age_possible < 40 || data.retirement_age_possible > 100)
		errors.retirement_age_possible = m.household_must_be_between();

	return errors;
}
