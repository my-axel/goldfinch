import { browser } from '$app/environment';
import { settingsApi } from '$lib/api/settings';
import type { FrontendSettings } from '$lib/types/settings';

const DEFAULTS: FrontendSettings = {
	ui_locale: 'en-US',
	number_locale: 'en-US',
	currency: 'USD',
	projection_pessimistic_rate: 4,
	projection_realistic_rate: 7,
	projection_optimistic_rate: 10,
	state_pension_pessimistic_rate: 0,
	state_pension_realistic_rate: 1,
	state_pension_optimistic_rate: 2,
	inflation_rate: 2
};

class SettingsStore {
	current = $state<FrontendSettings>({ ...DEFAULTS });
	loaded = $state(false);

	constructor() {
		if (browser) {
			this.load();
		}
	}

	async load() {
		try {
			const data = await settingsApi.get();
			const { id, created_at, updated_at, ...frontendSettings } = data;
			this.current = frontendSettings;
		} catch {
			// Keep defaults on error
		} finally {
			this.loaded = true;
		}
	}

	/** Update settings both locally and on the backend. */
	async update(updates: Partial<FrontendSettings>) {
		try {
			const data = await settingsApi.update(updates);
			const { id, created_at, updated_at, ...frontendSettings } = data;
			this.current = frontendSettings;
		} catch {
			// Revert on error by reloading
			await this.load();
		}
	}
}

export const settingsStore = new SettingsStore();
