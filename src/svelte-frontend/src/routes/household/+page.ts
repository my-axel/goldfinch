import type { PageLoad } from './$types';
import { householdApi } from '$lib/api/household';
import type { HouseholdMember } from '$lib/types/household';

export const load: PageLoad = async () => {
	try {
		const members = await householdApi.list();
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
