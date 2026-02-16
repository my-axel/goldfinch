import { api } from './client';
import type { Settings, SettingsUpdate } from '$lib/types/settings';

const PATH = '/api/v1/settings';

const RATE_FIELDS: (keyof Settings)[] = [
	'projection_pessimistic_rate',
	'projection_realistic_rate',
	'projection_optimistic_rate',
	'state_pension_pessimistic_rate',
	'state_pension_realistic_rate',
	'state_pension_optimistic_rate',
	'inflation_rate'
];

/** The backend returns rate fields as decimal strings — coerce them to numbers. */
function coerceRates(data: Settings): Settings {
	const result = { ...data };
	for (const field of RATE_FIELDS) {
		result[field] = Number(result[field]) as never;
	}
	return result;
}

export const settingsApi = {
	async get(): Promise<Settings> {
		return coerceRates(await api.get<Settings>(PATH));
	},

	async update(data: SettingsUpdate): Promise<Settings> {
		return coerceRates(await api.put<Settings>(PATH, data));
	}
};
