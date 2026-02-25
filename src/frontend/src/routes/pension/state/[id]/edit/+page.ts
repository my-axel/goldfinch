/**
 * @file src/routes/pension/state/[id]/edit/+page.ts
 * @kind route
 * @purpose Laedt Initialdaten fuer die Route 'pension/state/[id]/edit', verarbeitet Parameter und liefert fehlertolerantes PageData.
 */

import type { PageLoad } from './$types';
import { createPensionApi } from '$lib/api/pension';
import { PensionType, type StatePension } from '$lib/types/pension';

export const load: PageLoad = async ({ fetch, params }) => {
	const pensionId = Number(params.id);

	try {
		const pension = await createPensionApi(fetch).get<StatePension>(PensionType.STATE, pensionId);
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
