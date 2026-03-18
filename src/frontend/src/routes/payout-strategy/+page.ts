/**
 * @file src/routes/payout-strategy/+page.ts
 * @kind loader
 * @purpose Lädt Haushaltsmitglieder, Gap-Analysen, Pensionspläne und Einstellungen für die Auszahlungsstrategie-Seite.
 */

import { createHouseholdApi } from '$lib/api/household';
import { createCompassApi } from '$lib/api/compass';
import { createPensionApi } from '$lib/api/pension';
import { settingsApi } from '$lib/api/settings';

export const load = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
	const householdApi = createHouseholdApi(fetch);
	const compassApi = createCompassApi(fetch);
	const pensionApi = createPensionApi(fetch);

	const [members, gapConfigs, settings, pensions] = await Promise.all([
		householdApi.list(),
		compassApi.getAllConfigs(),
		settingsApi.get(),
		pensionApi.listAll()
	]);

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

	return { members, gapConfigs, analyses, settings, pensions };
};
