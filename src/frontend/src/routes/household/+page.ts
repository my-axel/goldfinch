/**
 * @file src/routes/household/+page.ts
 * @kind route
 * @purpose Laedt Initialdaten fuer die Route 'household', verarbeitet Parameter und liefert fehlertolerantes PageData.
 */

import type { PageLoad } from './$types';
import { createHouseholdApi } from '$lib/api/household';
import type { HouseholdMember } from '$lib/types/household';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const members = await createHouseholdApi(fetch).list();
		return {
			initialMembers: members,
			initialError: ''
		};
	} catch (error) {
		return {
			initialMembers: [] as HouseholdMember[],
			initialError: error instanceof Error ? error.message : 'Failed to load household members'
		};
	}
};
