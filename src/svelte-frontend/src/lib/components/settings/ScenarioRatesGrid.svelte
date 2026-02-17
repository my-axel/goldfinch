<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import RateInput from './RateInput.svelte';
	import type { FrontendSettings } from '$lib/types/settings';
	import { m } from '$lib/paraglide/messages.js';
	import { TrendingDown, ArrowRight, TrendingUp } from '@lucide/svelte';

	let {
		settings,
		onUpdate,
		disabled = false,
		rateErrors = {}
	}: {
		settings: FrontendSettings;
		onUpdate: (key: keyof FrontendSettings, value: number) => void;
		disabled?: boolean;
		rateErrors?: Record<string, string>;
	} = $props();

	const etfKeys = [
		'projection_pessimistic_rate',
		'projection_realistic_rate',
		'projection_optimistic_rate'
	] as const;
	const stateKeys = [
		'state_pension_pessimistic_rate',
		'state_pension_realistic_rate',
		'state_pension_optimistic_rate'
	] as const;
</script>

<Card
	title={m.settings_growth_rates_title()}
	description={m.settings_growth_rates_description()}
>
	<div class="space-y-8">
		<!-- Inflation Rate -->
		<div class="grid grid-cols-4 gap-6">
			<div class="flex items-center">
				<span class="text-base font-semibold">{m.settings_inflation_rate()}</span>
			</div>
			<div>
				<RateInput
					value={settings.inflation_rate}
					onChange={(v) => onUpdate('inflation_rate', v)}
					{disabled}
				/>
				{#if rateErrors.inflation_rate}
					<p class="text-xs text-destructive mt-1">{rateErrors.inflation_rate}</p>
				{/if}
			</div>
		</div>

		<hr class="border-border" />

		<!-- Scenario Rates Grid -->
		<div class="space-y-6">
			<!-- Header row -->
			<div class="grid grid-cols-4 gap-6">
				<div></div>
				<div class="grid grid-cols-3 gap-6 col-span-3">
					<div class="flex flex-col items-center w-24">
						<TrendingDown class="w-5 h-5 mb-2 text-yellow-500" />
						<span class="text-sm font-medium">{m.settings_pessimistic()}</span>
					</div>
					<div class="flex flex-col items-center w-24">
						<ArrowRight class="w-5 h-5 mb-2 text-blue-500" />
						<span class="text-sm font-medium">{m.settings_realistic()}</span>
					</div>
					<div class="flex flex-col items-center w-24">
						<TrendingUp class="w-5 h-5 mb-2 text-green-500" />
						<span class="text-sm font-medium">{m.settings_optimistic()}</span>
					</div>
				</div>
			</div>

			<!-- ETF Pension row -->
			<div class="grid grid-cols-4 gap-6">
				<div class="flex items-center">
					<span class="text-base">{m.settings_etf_pension()}</span>
				</div>
				<div class="grid grid-cols-3 gap-6 col-span-3">
					{#each etfKeys as key}
						<div>
							<RateInput
								value={settings[key]}
								onChange={(v) => onUpdate(key, v)}
								{disabled}
							/>
							{#if rateErrors[key]}
								<p class="text-xs text-destructive mt-1">{rateErrors[key]}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- State Pension row -->
			<div class="grid grid-cols-4 gap-6">
				<div class="flex items-center">
					<span class="text-base">{m.settings_state_pension()}</span>
				</div>
				<div class="grid grid-cols-3 gap-6 col-span-3">
					{#each stateKeys as key}
						<div>
							<RateInput
								value={settings[key]}
								onChange={(v) => onUpdate(key, v)}
								{disabled}
							/>
							{#if rateErrors[key]}
								<p class="text-xs text-destructive mt-1">{rateErrors[key]}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</Card>
