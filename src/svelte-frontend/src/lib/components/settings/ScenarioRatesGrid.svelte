<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import RateInput from './RateInput.svelte';
	import type { FrontendSettings } from '$lib/types/settings';

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
	title="Growth Rate Scenarios"
	description="Configure annual growth rates for different pension types"
>
	<div class="space-y-8">
		<!-- Inflation Rate -->
		<div class="grid grid-cols-4 gap-6">
			<div class="flex items-center">
				<span class="text-base font-semibold">Inflation Rate</span>
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
						<svg
							class="w-5 h-5 mb-2 text-yellow-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="1.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898M2.25 6l3 3m0-3h3"
							/>
						</svg>
						<span class="text-sm font-medium">Pessimistic</span>
					</div>
					<div class="flex flex-col items-center w-24">
						<svg
							class="w-5 h-5 mb-2 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="1.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
							/>
						</svg>
						<span class="text-sm font-medium">Realistic</span>
					</div>
					<div class="flex flex-col items-center w-24">
						<svg
							class="w-5 h-5 mb-2 text-green-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="1.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22M21.75 18V12m0 0h-6"
							/>
						</svg>
						<span class="text-sm font-medium">Optimistic</span>
					</div>
				</div>
			</div>

			<!-- ETF Pension row -->
			<div class="grid grid-cols-4 gap-6">
				<div class="flex items-center">
					<span class="text-base">ETF Pension</span>
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
					<span class="text-base">State Pension</span>
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
