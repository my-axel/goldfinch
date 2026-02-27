/**
 * @file src/lib/api/compass.ts
 * @kind api
 * @purpose API service for the Compass gap analysis feature (config CRUD + analysis endpoint).
 */

import { api, createApi } from './client';
import type {
	RetirementGapConfig,
	RetirementGapConfigCreate,
	RetirementGapConfigUpdate,
	GapAnalysisResult
} from '$lib/types/compass';

const BASE = '/api/v1/compass';

function buildCompassApi(client: ReturnType<typeof createApi>) {
	return {
		getAllConfigs: () => client.get<RetirementGapConfig[]>(`${BASE}/gap-config`),
		getConfig: (memberId: number) =>
			client.get<RetirementGapConfig>(`${BASE}/gap-config/${memberId}`),
		createConfig: (memberId: number, data: RetirementGapConfigCreate) =>
			client.post<RetirementGapConfig>(`${BASE}/gap-config/${memberId}`, data),
		updateConfig: (memberId: number, data: RetirementGapConfigUpdate) =>
			client.put<RetirementGapConfig>(`${BASE}/gap-config/${memberId}`, data),
		deleteConfig: (memberId: number) => client.delete<void>(`${BASE}/gap-config/${memberId}`),
		getAnalysis: (memberId: number) =>
			client.get<GapAnalysisResult>(`${BASE}/gap-analysis/${memberId}`)
	};
}

// Factory for load functions — pass SvelteKit's fetch
export function createCompassApi(fetchFn: typeof fetch) {
	return buildCompassApi(createApi(fetchFn));
}

// Default singleton — used in stores and event handlers
export const compassApi = buildCompassApi(api);
