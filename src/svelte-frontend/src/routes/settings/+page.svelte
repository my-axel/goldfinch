<script lang="ts">
	import type { FrontendSettings } from '$lib/types/settings';
	import {
		UILocale,
		UI_LOCALE_LABELS,
		NumberLocale,
		NUMBER_LOCALE_LABELS,
		Currency,
		CURRENCY_LABELS
	} from '$lib/types/settings';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import NumberFormatPreview from '$lib/components/settings/NumberFormatPreview.svelte';
	import ProjectionPreview from '$lib/components/settings/ProjectionPreview.svelte';
	import ScenarioRatesGrid from '$lib/components/settings/ScenarioRatesGrid.svelte';
	import { m } from '$lib/paraglide/messages.js';

	// Bind to the global settings store
	let settings = $derived(settingsStore.current);
	let loading = $derived(!settingsStore.loaded);
	let rateErrors = $state<Record<string, string>>({});


	// Update a setting via the global store
	async function updateSetting(updates: Partial<FrontendSettings>) {
		await settingsStore.update(updates);
	}

	// Rate validation
	function validateRateRelationships(
		type: 'projection' | 'state_pension',
		scenario: 'pessimistic' | 'realistic' | 'optimistic',
		newValue: number
	): boolean {
		const values = {
			pessimistic:
				scenario === 'pessimistic'
					? newValue
					: settings[`${type}_pessimistic_rate` as keyof FrontendSettings],
			realistic:
				scenario === 'realistic'
					? newValue
					: settings[`${type}_realistic_rate` as keyof FrontendSettings],
			optimistic:
				scenario === 'optimistic'
					? newValue
					: settings[`${type}_optimistic_rate` as keyof FrontendSettings]
		};

		const errorKey = `${type}_${scenario}_rate`;
		const label = type === 'projection' ? m.settings_etf_pension() : m.settings_state_pension();

		if (scenario === 'pessimistic' && values.pessimistic > values.realistic) {
			rateErrors = { ...rateErrors, [errorKey]: m.settings_rate_pessimistic_exceeds_realistic({ label }) };
			return false;
		}
		if (scenario === 'realistic') {
			if (values.realistic < values.pessimistic) {
				rateErrors = { ...rateErrors, [errorKey]: m.settings_rate_realistic_below_pessimistic({ label }) };
				return false;
			}
			if (values.realistic > values.optimistic) {
				rateErrors = { ...rateErrors, [errorKey]: m.settings_rate_realistic_exceeds_optimistic({ label }) };
				return false;
			}
		}
		if (scenario === 'optimistic' && values.optimistic < values.realistic) {
			rateErrors = { ...rateErrors, [errorKey]: m.settings_rate_optimistic_below_realistic({ label }) };
			return false;
		}

		// Clear error
		if (rateErrors[errorKey]) {
			rateErrors = { ...rateErrors, [errorKey]: '' };
		}
		return true;
	}

	function handleRateChange(key: keyof FrontendSettings, value: number) {
		if (key === 'inflation_rate') {
			updateSetting({ [key]: value });
			return;
		}

		// Parse type and scenario from key like "projection_pessimistic_rate"
		const parts = key.split('_');
		const scenario = parts[parts.length - 2] as 'pessimistic' | 'realistic' | 'optimistic';
		const type = key.startsWith('state_pension') ? 'state_pension' : 'projection';

		if (validateRateRelationships(type, scenario, value)) {
			updateSetting({ [key]: value });
		}
	}
</script>

<div class="space-y-6">
	<PageHeader
		title={m.settings_title()}
		description={m.settings_description()}
	/>

	{#if !settingsStore.loaded}
		<p class="text-center text-muted-foreground py-8">{m.settings_loading()}</p>
	{/if}

	<!-- Language Settings -->
	<ContentSection>
		<Card title={m.settings_language_title()} description={m.settings_language_description()}>
			<div class="space-y-4">
				<div>
					<label for="ui-locale" class="block text-sm font-medium mb-2">{m.settings_interface_language()}</label>
					<select
						id="ui-locale"
						value={settings.ui_locale}
						onchange={(e) => updateSetting({ ui_locale: (e.target as HTMLSelectElement).value })}
						disabled={loading}
						class="w-[280px] rounded-lg border border-input bg-background px-3 py-2 text-sm
							focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
					>
						{#each Object.values(UILocale) as locale}
							<option value={locale}>{UI_LOCALE_LABELS[locale]}</option>
						{/each}
					</select>
				</div>
			</div>
		</Card>
	</ContentSection>

	<!-- Number & Currency Format -->
	<ContentSection>
		<Card title={m.settings_number_format_title()} description={m.settings_number_format_description()}>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="number-locale" class="block text-sm font-medium mb-2">{m.settings_number_date_format()}</label>
					<select
						id="number-locale"
						value={settings.number_locale}
						onchange={(e) => updateSetting({ number_locale: (e.target as HTMLSelectElement).value })}
						disabled={loading}
						class="w-[280px] rounded-lg border border-input bg-background px-3 py-2 text-sm
							focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
					>
						{#each Object.values(NumberLocale) as locale}
							<option value={locale}>{NUMBER_LOCALE_LABELS[locale]}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="currency" class="block text-sm font-medium mb-2">{m.settings_default_currency()}</label>
					<select
						id="currency"
						value={settings.currency}
						onchange={(e) => updateSetting({ currency: (e.target as HTMLSelectElement).value })}
						disabled={loading}
						class="w-[280px] rounded-lg border border-input bg-background px-3 py-2 text-sm
							focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
					>
						{#each Object.values(Currency) as cur}
							<option value={cur}>{CURRENCY_LABELS[cur]}</option>
						{/each}
					</select>
				</div>
			</div>
		</Card>

		{#snippet aside()}
			<Explanation title={m.settings_format_preview()}>
				<NumberFormatPreview locale={settings.number_locale} currency={settings.currency} />
			</Explanation>
		{/snippet}
	</ContentSection>

	<!-- Growth Rate Scenarios -->
	<ContentSection>
		<ScenarioRatesGrid
			{settings}
			onUpdate={handleRateChange}
			disabled={loading}
			{rateErrors}
		/>

		{#snippet aside()}
			<ProjectionPreview
				locale={settings.number_locale}
				currency={settings.currency}
				inflationRate={settings.inflation_rate}
				pessimisticRate={settings.projection_pessimistic_rate}
				realisticRate={settings.projection_realistic_rate}
				optimisticRate={settings.projection_optimistic_rate}
			/>
		{/snippet}
	</ContentSection>

	<!-- Theme Settings -->
	<ContentSection>
		<Card title={m.settings_theme_title()} description={m.settings_theme_description()}>
			<div class="grid grid-cols-3 gap-4">
				{#each [
					{ value: 'light', label: m.theme_light(), icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' },
					{ value: 'dark', label: m.theme_dark(), icon: 'M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' },
					{ value: 'system', label: m.theme_system(), icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25' }
				] as option}
					<button
						onclick={() => themeStore.set(option.value as 'light' | 'dark' | 'system')}
						class="p-3 rounded-lg border cursor-pointer transition-colors
							{themeStore.current === option.value
							? 'bg-primary/10 border-primary'
							: 'bg-card border-border hover:border-primary/50'}"
					>
						<div class="flex items-center justify-center mb-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d={option.icon} />
							</svg>
						</div>
						<p class="text-xs font-medium text-center">{option.label}</p>
					</button>
				{/each}
			</div>
		</Card>
	</ContentSection>
</div>
