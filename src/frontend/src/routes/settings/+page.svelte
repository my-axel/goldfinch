<!--
@file src/routes/settings/+page.svelte
@kind route
@purpose Rendert die Route 'settings' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
@contains Reaktiver Seitenzustand wird ueber `\$state`, `\$derived` und `\$effect` organisiert.
@contains Kernfunktionen `updateSetting()`, `validateRateRelationships()`, `handleRateChange()` steuern Laden, Aktionen und Fehlerpfade.
@contains Das Markup verdrahtet Sektionen, Dialoge und Aktionen fuer den Route-Workflow.
-->

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
	import { Sun, Moon, Monitor } from '@lucide/svelte';

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
						class="h-9 w-[280px] rounded-lg border border-input bg-background px-3 py-2 text-sm
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
						class="h-9 w-[280px] rounded-lg border border-input bg-background px-3 py-2 text-sm
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
						class="h-9 w-[280px] rounded-lg border border-input bg-background px-3 py-2 text-sm
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
					{ value: 'light', label: m.theme_light(), icon: Sun },
					{ value: 'dark', label: m.theme_dark(), icon: Moon },
					{ value: 'system', label: m.theme_system(), icon: Monitor }
				] as option}
					<button
						onclick={() => themeStore.set(option.value as 'light' | 'dark' | 'system')}
						class="p-3 rounded-lg border cursor-pointer transition-colors
							{themeStore.current === option.value
							? 'bg-primary/10 border-primary'
							: 'bg-card border-border hover:border-primary/50'}"
					>
						<div class="flex items-center justify-center mb-2">
							<option.icon class="w-4 h-4" />
						</div>
						<p class="text-xs font-medium text-center">{option.label}</p>
					</button>
				{/each}
			</div>
		</Card>
	</ContentSection>
</div>
