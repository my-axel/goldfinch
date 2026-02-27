<!--
@file src/lib/components/compass/GapResultDisplay.svelte
@kind component
@purpose Shows computed gap analysis results: key metrics and color-coded final gap for all three scenarios.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { GapAnalysisResult } from '$lib/types/compass';

	let { result }: { result: GapAnalysisResult } = $props();

	/** Color class based on gap relative to required capital */
	function gapColorClass(gap: number): string {
		if (gap <= 0) return 'text-green-600 dark:text-green-400';
		const required = result.required_capital_adjusted;
		if (required > 0 && gap <= required * 0.25) return 'text-yellow-600 dark:text-yellow-400';
		return 'text-red-600 dark:text-red-400';
	}

	function gapLabel(gap: number): string {
		return gap <= 0 ? m.compass_gap_surplus() : m.compass_gap_shortfall();
	}

	const scenarios = $derived([
		{ label: 'Pessimistic', gap: result.gap.pessimistic, projected: result.projected_capital.pessimistic },
		{ label: 'Realistic', gap: result.gap.realistic, projected: result.projected_capital.realistic },
		{ label: 'Optimistic', gap: result.gap.optimistic, projected: result.projected_capital.optimistic }
	]);
</script>

<div class="space-y-6">
	{#if result.retirement_already_reached}
		<div class="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
			{m.compass_gap_retirement_already_reached()}
		</div>
	{/if}

	<!-- Key Metrics Grid -->
	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_needed_monthly()}</p>
			<p class="text-base font-semibold">
				<FormattedCurrency value={result.needed_monthly} decimals={0} />
				{#if result.uses_override}
					<span class="ml-1 text-xs font-normal text-muted-foreground">({m.compass_gap_uses_override()})</span>
				{/if}
			</p>
		</div>

		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_pension_income()}</p>
			<p class="text-base font-semibold">
				<FormattedCurrency value={result.monthly_pension_income} decimals={0} />
			</p>
		</div>

		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_monthly_gap()}</p>
			<p class="text-base font-semibold {result.remaining_monthly_gap <= 0 ? 'text-green-600 dark:text-green-400' : ''}">
				<FormattedCurrency value={result.remaining_monthly_gap} decimals={0} />
			</p>
		</div>

		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_years_to_retirement()}</p>
			<p class="text-base font-semibold">{Math.max(0, Math.round(result.years_to_retirement))} yrs</p>
		</div>

		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_required_capital()}</p>
			<p class="text-base font-semibold">
				<FormattedCurrency value={result.required_capital} decimals={0} />
			</p>
		</div>

		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_required_capital_adjusted()}</p>
			<p class="text-base font-semibold">
				<FormattedCurrency value={result.required_capital_adjusted} decimals={0} />
			</p>
		</div>
	</div>

	<!-- Scenario Results -->
	<div>
		<p class="text-sm font-medium mb-3">{m.compass_gap_final_gap()}</p>
		<div class="grid grid-cols-3 gap-3">
			{#each scenarios as scenario (scenario.label)}
				<div class="rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-center">
					<p class="text-xs text-muted-foreground">{scenario.label}</p>
					<p class="text-xs text-muted-foreground">{m.compass_gap_projected_capital()}: <FormattedCurrency value={scenario.projected} decimals={0} /></p>
					<p class="text-sm font-bold {gapColorClass(scenario.gap)}">
						<FormattedCurrency value={Math.abs(scenario.gap)} decimals={0} />
					</p>
					<p class="text-xs {gapColorClass(scenario.gap)}">{gapLabel(scenario.gap)}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
