<!--
@file src/lib/components/dashboard/RetirementGapCard.svelte
@kind component
@purpose Dashboard summary card for retirement gap. Shows CTA when no config exists, or realistic gap + range when configured.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import { compassApi } from '$lib/api/compass';
	import type { GapAnalysisResult } from '$lib/types/compass';

	let analysis = $state<GapAnalysisResult | null>(null);
	let loading = $state(false);

	async function loadAnalysis(memberId: number | undefined) {
		if (memberId === undefined) {
			analysis = null;
			return;
		}
		loading = true;
		try {
			analysis = await compassApi.getAnalysis(memberId);
		} catch {
			// 404 or no config → show CTA
			analysis = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadAnalysis(dashboardStore.selectedMemberId);
	});

	const gapColorClass = $derived.by(() => {
		if (!analysis) return '';
		const gap = analysis.gap.realistic;
		if (gap <= 0) return 'text-green-600 dark:text-green-400';
		const required = analysis.required_capital_adjusted;
		if (required > 0 && gap <= required * 0.25) return 'text-yellow-600 dark:text-yellow-400';
		return 'text-red-600 dark:text-red-400';
	});
</script>

<div class="bg-card rounded-xl border border-border shadow-sm p-6">
	{#if loading}
		<div class="flex items-center justify-center h-24 text-muted-foreground text-sm">…</div>
	{:else if analysis}
		<!-- State B: analysis available -->
		<div class="space-y-3">
			<h3 class="text-lg font-semibold">{m.dashboard_retirement_gap_title()}</h3>

			<div>
				<p class="text-3xl font-bold {gapColorClass}">
					{#if analysis.gap.realistic <= 0}
						+<FormattedCurrency value={Math.abs(analysis.gap.realistic)} decimals={0} />
					{:else}
						<FormattedCurrency value={analysis.gap.realistic} decimals={0} />
					{/if}
				</p>
				<p class="text-sm text-muted-foreground mt-0.5">
					{analysis.gap.realistic <= 0 ? m.dashboard_retirement_gap_surplus() : m.dashboard_retirement_gap_shortfall()}
				</p>
			</div>

			<p class="text-xs text-muted-foreground">
				{m.dashboard_retirement_gap_range({
					pessimistic: analysis.gap.pessimistic.toLocaleString(undefined, { maximumFractionDigits: 0 }),
					optimistic: analysis.gap.optimistic.toLocaleString(undefined, { maximumFractionDigits: 0 })
				})}
			</p>

			<a href="/compass" class="text-sm text-primary hover:underline">{m.dashboard_retirement_gap_view_details()}</a>
		</div>
	{:else}
		<!-- State A: no config / no member selected -->
		<div class="space-y-3">
			<h3 class="text-lg font-semibold">{m.dashboard_retirement_gap_title()}</h3>
			<p class="text-sm text-muted-foreground">{m.dashboard_retirement_gap_description()}</p>
			<a
				href="/compass"
				class="inline-block text-sm font-medium text-primary hover:underline"
			>
				{m.dashboard_retirement_gap_setup_cta()}
			</a>
		</div>
	{/if}
</div>
