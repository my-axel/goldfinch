/**
 * @file src/routes/plan/+page.ts
 * @kind loader
 * @purpose Loads household members and existing gap configs (+ analyses/timelines for configured members).
 */

import { createHouseholdApi } from '$lib/api/household';
import { createCompassApi } from '$lib/api/compass';

export const load = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
	const householdApi = createHouseholdApi(fetch);
	const compassApi = createCompassApi(fetch);

	const [members, gapConfigs] = await Promise.all([householdApi.list(), compassApi.getAllConfigs()]);

	const [analyses, timelines] = await Promise.all([
		Promise.all(
			members.map(async (member) => {
				const hasConfig = gapConfigs.some((c) => c.member_id === member.id);
				if (!hasConfig) return null;
				try {
					return await compassApi.getAnalysis(member.id);
				} catch {
					return null;
				}
			})
		),
		Promise.all(
			members.map(async (member) => {
				const hasConfig = gapConfigs.some((c) => c.member_id === member.id);
				if (!hasConfig) return null;
				try {
					return await compassApi.getTimeline(member.id);
				} catch {
					return null;
				}
			})
		)
	]);

	return { members, gapConfigs, analyses, timelines };
};
