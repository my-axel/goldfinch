/**
 * @file src/routes/compass/+page.ts
 * @kind loader
 * @purpose Loads household members and existing gap configs (+ analyses for configured members).
 */

import { createHouseholdApi } from '$lib/api/household';
import { createCompassApi } from '$lib/api/compass';

export const load = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
	const householdApi = createHouseholdApi(fetch);
	const compassApi = createCompassApi(fetch);

	const [members, gapConfigs] = await Promise.all([householdApi.list(), compassApi.getAllConfigs()]);

	// Pre-load analysis for members that already have a config
	const analyses = await Promise.all(
		members.map(async (member) => {
			const hasConfig = gapConfigs.some((c) => c.member_id === member.id);
			if (!hasConfig) return null;
			try {
				return await compassApi.getAnalysis(member.id);
			} catch {
				return null;
			}
		})
	);

	return { members, gapConfigs, analyses };
};
