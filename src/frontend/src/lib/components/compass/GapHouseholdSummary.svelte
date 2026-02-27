<!--
@file src/lib/components/compass/GapHouseholdSummary.svelte
@kind component
@purpose Shows the household-wide gap summary: summed realistic gap, status badge, and pessimistic–optimistic range.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { GapAnalysisResult } from '$lib/types/compass';

	let { analyses }: { analyses: (GapAnalysisResult | null)[] } = $props();

	const validAnalyses = $derived(analyses.filter((a): a is GapAnalysisResult => a !== null));

	const totals = $derived.by(() => {
		const pessimistic = validAnalyses.reduce((s, a) => s + a.gap.pessimistic, 0);
		const realistic = validAnalyses.reduce((s, a) => s + a.gap.realistic, 0);
		const optimistic = validAnalyses.reduce((s, a) => s + a.gap.optimistic, 0);
		return { pessimistic, realistic, optimistic };
	});

	const status = $derived.by(() => {
		const gap = totals.realistic;
		const totalRequired = validAnalyses.reduce((s, a) => s + a.required_capital_adjusted, 0);
		if (gap <= 0) return { label: m.compass_gap_on_track(), cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', valueClass: 'text-green-600 dark:text-green-400' };
		if (totalRequired > 0 && gap <= totalRequired * 0.25) return { label: m.compass_gap_needs_attention(), cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', valueClass: 'text-yellow-600 dark:text-yellow-400' };
		return { label: m.compass_gap_critical(), cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', valueClass: 'text-red-600 dark:text-red-400' };
	});
</script>

{#if validAnalyses.length > 0}
	<div class="bg-card rounded-xl border border-border shadow-sm p-6">
		<div class="flex items-start justify-between mb-4">
			<h2 class="text-lg font-semibold">{m.compass_gap_household_total()}</h2>
			<span class="text-xs px-2.5 py-1 rounded-full font-medium {status.cls}">{status.label}</span>
		</div>

		<div class="space-y-2">
			<!-- Realistic gap (prominent) -->
			<div>
				<p class="text-xs text-muted-foreground mb-1">Realistic</p>
				<p class="text-3xl font-bold {status.valueClass}">
					{#if totals.realistic <= 0}
						+<FormattedCurrency value={Math.abs(totals.realistic)} decimals={0} />
						<span class="text-sm font-normal ml-2">{m.compass_gap_surplus()}</span>
					{:else}
						<FormattedCurrency value={totals.realistic} decimals={0} />
						<span class="text-sm font-normal ml-2">{m.compass_gap_shortfall()}</span>
					{/if}
				</p>
			</div>

			<!-- Scenario range -->
			<div class="flex items-center gap-6 text-sm text-muted-foreground">
				<span>
					Pessimistic:
					<span class="font-medium text-foreground">
						<FormattedCurrency value={totals.pessimistic} decimals={0} />
					</span>
				</span>
				<span>
					Optimistic:
					<span class="font-medium text-foreground">
						<FormattedCurrency value={totals.optimistic} decimals={0} />
					</span>
				</span>
			</div>
		</div>
	</div>
{/if}
