/**
 * @file src/routes/compass/[member_id]/+page.ts
 * @kind loader
 * @purpose Loads household member + gap config, analysis, and timeline for the compass detail page.
 */

import { createHouseholdApi } from '$lib/api/household';
import { createCompassApi } from '$lib/api/compass';
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

	let member;
	try {
		member = await householdApi.get(memberId);
	} catch {
		throw error(404, 'Member not found');
	}

	let config = null;
	try {
		config = await compassApi.getConfig(memberId);
	} catch {
		config = null;
	}

	let analysis = null;
	let timeline = null;
	if (config) {
		[analysis, timeline] = await Promise.all([
			compassApi.getAnalysis(memberId).catch(() => null),
			compassApi.getTimeline(memberId).catch(() => null)
		]);
	}

	return { member, config, analysis, timeline };
};
