import { api } from './client';
import type { HouseholdMember, HouseholdMemberFormData } from '$lib/types/household';
import { addYearsIsoDate } from '$lib/utils/date-only';

const BASE = '/api/v1/household';

function formatForApi(data: HouseholdMemberFormData): Record<string, unknown> {
	return {
		first_name: data.first_name,
		last_name: data.last_name,
		birthday: data.birthday,
		retirement_age_planned: data.retirement_age_planned,
		retirement_age_possible: data.retirement_age_possible,
		retirement_date_planned: addYearsIsoDate(data.birthday, data.retirement_age_planned),
		retirement_date_possible: addYearsIsoDate(data.birthday, data.retirement_age_possible)
	};
}

export const householdApi = {
	list: () => api.get<HouseholdMember[]>(BASE),
	get: (id: number) => api.get<HouseholdMember>(`${BASE}/${id}`),
	create: (data: HouseholdMemberFormData) => api.post<HouseholdMember>(BASE, formatForApi(data)),
	update: (id: number, data: HouseholdMemberFormData) =>
		api.put<HouseholdMember>(`${BASE}/${id}`, formatForApi(data)),
	delete: (id: number) => api.delete<void>(`${BASE}/${id}`)
};
