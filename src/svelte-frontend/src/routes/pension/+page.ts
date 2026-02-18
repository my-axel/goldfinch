import type { PageLoad } from './$types';
import { householdApi } from '$lib/api/household';
import { pensionApi } from '$lib/api/pension';
import type { HouseholdMember } from '$lib/types/household';
import type { PensionListItem } from '$lib/types/pension';

export const load: PageLoad = async () => {
	try {
		const [members, pensions] = await Promise.all([householdApi.list(), pensionApi.listAll()]);
		return {
			initialMembers: members,
			initialPensions: pensions,
			initialError: ''
		};
	} catch (error) {
		return {
			initialMembers: [] as HouseholdMember[],
			initialPensions: [] as PensionListItem[],
			initialError: error instanceof Error ? error.message : 'Failed to load pensions'
		};
	}
};
