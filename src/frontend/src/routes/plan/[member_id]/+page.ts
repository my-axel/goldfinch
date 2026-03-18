/**
 * @file src/routes/plan/[member_id]/+page.ts
 * @kind loader
 * @purpose Loads member, gap config/analysis/timeline, pensions, and settings for the unified retirement plan detail page.
 */

import { createHouseholdApi } from '$lib/api/household';
import { createCompassApi } from '$lib/api/compass';
import { createPensionApi } from '$lib/api/pension';
import { settingsApi } from '$lib/api/settings';
import { error } from '@sveltejs/kit';

export const load = async ({
	fetch,
	params
}: {
	fetch: typeof globalThis.fetch;
	params: { member_id: string };
}) => {
	const memberId = parseInt(params.member_id, 10);
	if (isNaN(memberId)) throw error(400, 'Invalid member ID');

	const householdApi = createHouseholdApi(fetch);
	const compassApi = createCompassApi(fetch);
	const pensionApi = createPensionApi(fetch);

	let member;
	try {
		member = await householdApi.get(memberId);
	} catch {
		throw error(404, 'Member not found');
	}

	const [config, settings, allPensions] = await Promise.all([
		compassApi.getConfig(memberId).catch(() => null),
		settingsApi.get(),
		pensionApi.listAll()
	]);

	const pensions = allPensions.filter((p) => p.member_id === memberId);

	let analysis = null;
	let timeline = null;
	if (config) {
		[analysis, timeline] = await Promise.all([
			compassApi.getAnalysis(memberId).catch(() => null),
			compassApi.getTimeline(memberId).catch(() => null)
		]);
	}

	return { member, config, analysis, timeline, settings, pensions };
};
