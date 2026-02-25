/**
 * @file src/lib/stores/settings.svelte.ts
 * @kind store
 * @purpose Verwaltet globale Frontend-Einstellungen inkl. Laden, Persistenz und Locale-Synchronisierung.
 * @contains Store-Statusfelder werden reaktiv verwaltet und von Konsumenten direkt beobachtet.
 * @contains Aktionen `toParaglideLocale()`, `load()`, `update()` aktualisieren State, triggern API-Aufrufe und setzen Fehlerzustand.
 */

import { browser } from '$app/environment';
import { settingsApi } from '$lib/api/settings';
import type { FrontendSettings } from '$lib/types/settings';
import { setLocale } from '$lib/paraglide/runtime.js';

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

/** Map ui_locale values (en-US, en-GB, de-DE) to Paraglide locales (en, de). */
function toParaglideLocale(uiLocale: string): 'en' | 'de' {
	if (uiLocale.startsWith('de')) return 'de';
	return 'en';
}

class SettingsStore {
	current = $state<FrontendSettings>({ ...DEFAULTS });
	loaded = $state(false);
	/** Reactive Paraglide locale — used as a `{#key}` in the layout to force re-render on language change. */
	locale = $state<'en' | 'de'>('en');

	constructor() {
		if (browser) {
			this.load();
		}
	}

	/** Sync Paraglide locale with the current ui_locale setting. */
	private syncLocale() {
		if (browser) {
			const newLocale = toParaglideLocale(this.current.ui_locale);
			setLocale(newLocale, { reload: false });
			this.locale = newLocale;
		}
	}

	async load() {
		try {
			const data = await settingsApi.get();
			const { id, created_at, updated_at, ...frontendSettings } = data;
			this.current = frontendSettings;
			this.syncLocale();
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
			if (updates.ui_locale) {
				this.syncLocale();
			}
		} catch {
			// Revert on error by reloading
			await this.load();
		}
	}
}

export const settingsStore = new SettingsStore();
