<!--
@file src/lib/components/compass/GapHouseholdSummary.svelte
@kind component
@purpose Shows the household-wide gap summary: summed realistic gap, status badge, and pessimistic–optimistic range.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { GapAnalysisResult } from '$lib/types/compass';
	import { aggregateGapAnalyses, gapStatusFor, toGapDisplayValue } from '$lib/utils/retirement-gap';

	let { analyses }: { analyses: (GapAnalysisResult | null)[] } = $props();

	const summary = $derived(aggregateGapAnalyses(analyses));
	const realisticDisplay = $derived(toGapDisplayValue(summary.totals.realistic));
	const pessimisticDisplay = $derived(toGapDisplayValue(summary.totals.pessimistic));
	const optimisticDisplay = $derived(toGapDisplayValue(summary.totals.optimistic));

	const status = $derived.by(() => {
		const statusKey = gapStatusFor(summary.totals.realistic, summary.totalRequired);
		if (statusKey === 'on_track') {
			return {
				label: m.compass_gap_on_track(),
				cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
				valueClass: 'text-green-600 dark:text-green-400'
			};
		}
		if (statusKey === 'needs_attention') {
			return {
				label: m.compass_gap_needs_attention(),
				cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
				valueClass: 'text-yellow-600 dark:text-yellow-400'
			};
		}
		return {
			label: m.compass_gap_critical(),
			cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
			valueClass: 'text-red-600 dark:text-red-400'
		};
	});
</script>

{#if summary.count > 0 && realisticDisplay && pessimisticDisplay && optimisticDisplay}
	<div class="bg-card rounded-xl border border-border shadow-sm p-6">
		<div class="flex items-start justify-between mb-4">
			<h2 class="text-lg font-semibold">{m.compass_gap_household_total()}</h2>
			<span class="text-xs px-2.5 py-1 rounded-full font-medium {status.cls}">{status.label}</span>
		</div>

		<div class="space-y-2">
			<!-- Realistic gap (prominent) -->
			<div>
				<p class="text-xs text-muted-foreground mb-1">{m.settings_realistic()}</p>
				<p class="text-3xl font-bold {status.valueClass}">
					{#if realisticDisplay.isSurplus}
						+<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />
						<span class="text-sm font-normal ml-2">{m.compass_gap_surplus()}</span>
					{:else}
						<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />
						<span class="text-sm font-normal ml-2">{m.compass_gap_shortfall()}</span>
					{/if}
				</p>
			</div>

			<!-- Scenario range -->
			<div class="flex items-center gap-6 text-sm text-muted-foreground">
				<span>
					{m.settings_pessimistic()}:
					<span class="font-medium text-foreground">
						{#if pessimisticDisplay.isSurplus}+{/if}<FormattedCurrency value={pessimisticDisplay.absolute} decimals={0} />
					</span>
					<span class="ml-1 text-xs">{pessimisticDisplay.isSurplus ? m.compass_gap_surplus() : m.compass_gap_shortfall()}</span>
				</span>
				<span>
					{m.settings_optimistic()}:
					<span class="font-medium text-foreground">
						{#if optimisticDisplay.isSurplus}+{/if}<FormattedCurrency value={optimisticDisplay.absolute} decimals={0} />
					</span>
					<span class="ml-1 text-xs">{optimisticDisplay.isSurplus ? m.compass_gap_surplus() : m.compass_gap_shortfall()}</span>
				</span>
			</div>
		</div>
	</div>
{/if}
