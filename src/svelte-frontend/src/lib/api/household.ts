import { api, createApi } from './client';
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

function buildHouseholdApi(client: ReturnType<typeof createApi>) {
	return {
		list: () => client.get<HouseholdMember[]>(BASE),
		get: (id: number) => client.get<HouseholdMember>(`${BASE}/${id}`),
		create: (data: HouseholdMemberFormData) => client.post<HouseholdMember>(BASE, formatForApi(data)),
		update: (id: number, data: HouseholdMemberFormData) =>
			client.put<HouseholdMember>(`${BASE}/${id}`, formatForApi(data)),
		delete: (id: number) => client.delete<void>(`${BASE}/${id}`)
	};
}

// Factory for load functions — pass SvelteKit's fetch to avoid window.fetch warnings
export function createHouseholdApi(fetchFn: typeof fetch) {
	return buildHouseholdApi(createApi(fetchFn));
}

// Default singleton — used in stores and event handlers (outside load functions)
export const householdApi = buildHouseholdApi(api);
