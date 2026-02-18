import type { PageLoad } from './$types';
import { pensionApi } from '$lib/api/pension';
import { PensionType, type StatePension } from '$lib/types/pension';

export const load: PageLoad = async ({ params }) => {
	const pensionId = Number(params.id);

	try {
		const pension = await pensionApi.get<StatePension>(PensionType.STATE, pensionId);
		return {
			pensionId,
			initialPension: pension,
			initialError: ''
		};
	} catch (error) {
		return {
			pensionId,
			initialPension: null,
			initialError: error instanceof Error ? error.message : 'Failed to load pension'
		};
	}
};
