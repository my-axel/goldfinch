/**
 * @file src/routes/pension/etf/[id]/edit/+page.ts
 * @kind route
 * @purpose Laedt Initialdaten fuer die Route 'pension/etf/[id]/edit', verarbeitet Parameter und liefert fehlertolerantes PageData.
 */

import type { PageLoad } from './$types';
import { createPensionApi } from '$lib/api/pension';
import { createHouseholdApi } from '$lib/api/household';
import { PensionType, type ETFPension } from '$lib/types/pension';
import type { HouseholdMember } from '$lib/types/household';

export const load: PageLoad = async ({ fetch, params }) => {
	const pensionId = Number(params.id);
	try {
		const pension = await createPensionApi(fetch).get<ETFPension>(PensionType.ETF_PLAN, pensionId);

		// Load member data to get retirement date for projections
		let member: HouseholdMember | null = null;
		try {
			const members = await createHouseholdApi(fetch).list();
			member = members.find((m) => m.id === pension.member_id) ?? null;
		} catch {
			// Non-critical: projections will just not show retirement date
		}

		return { pensionId, initialPension: pension, member, initialError: '' };
	} catch (error) {
		return {
			pensionId,
			initialPension: null as ETFPension | null,
			member: null as HouseholdMember | null,
			initialError: error instanceof Error ? error.message : 'Failed to load pension'
		};
	}
};
