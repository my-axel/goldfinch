import type { PageLoad } from './$types';
import { createPensionApi } from '$lib/api/pension';
import { PensionType, type InsurancePension } from '$lib/types/pension';

export const load: PageLoad = async ({ fetch, params }) => {
	const pensionId = Number(params.id);
	try {
		const pension = await createPensionApi(fetch).get<InsurancePension>(PensionType.INSURANCE, pensionId);
		return { pensionId, initialPension: pension, initialError: '' };
	} catch (error) {
		return {
			pensionId,
			initialPension: null as InsurancePension | null,
			initialError: error instanceof Error ? error.message : 'Failed to load pension'
		};
	}
};
