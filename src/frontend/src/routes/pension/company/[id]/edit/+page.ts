/**
 * @file src/routes/pension/company/[id]/edit/+page.ts
 * @kind route
 * @purpose Laedt Initialdaten fuer die Route 'pension/company/[id]/edit', verarbeitet Parameter und liefert fehlertolerantes PageData.
 */

import type { PageLoad } from './$types';
import { createPensionApi } from '$lib/api/pension';
import { PensionType, type CompanyPension } from '$lib/types/pension';

export const load: PageLoad = async ({ fetch, params }) => {
	const pensionId = Number(params.id);
	try {
		const pension = await createPensionApi(fetch).get<CompanyPension>(PensionType.COMPANY, pensionId);
		return { pensionId, initialPension: pension, initialError: '' };
	} catch (error) {
		return {
			pensionId,
			initialPension: null as CompanyPension | null,
			initialError: error instanceof Error ? error.message : 'Failed to load pension'
		};
	}
};
