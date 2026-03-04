<!--
@file src/lib/components/compass/GapOverviewPanel.svelte
@kind component
@purpose Shows the household-wide gap summary with per-member overview rows for at-a-glance status.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { GapAnalysisResult } from '$lib/types/compass';
	import type { HouseholdMember } from '$lib/types/household';
	import { aggregateGapAnalyses, gapStatusFor, toGapDisplayValue } from '$lib/utils/retirement-gap';

	let {
		analyses,
		members
	}: {
		analyses: (GapAnalysisResult | null)[];
		members: HouseholdMember[];
	} = $props();

	const summary = $derived(aggregateGapAnalyses(analyses));
	const realisticDisplay = $derived(toGapDisplayValue(summary.totals.realistic));
	const pessimisticDisplay = $derived(toGapDisplayValue(summary.totals.pessimistic));
	const optimisticDisplay = $derived(toGapDisplayValue(summary.totals.optimistic));

	const householdStatus = $derived.by(() => {
		const statusKey = gapStatusFor(summary.totals.realistic, summary.totalRequired);
		if (statusKey === 'on_track')
			return {
				label: m.compass_gap_on_track(),
				cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
				valueClass: 'text-green-600 dark:text-green-400'
			};
		if (statusKey === 'needs_attention')
			return {
				label: m.compass_gap_needs_attention(),
				cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
				valueClass: 'text-yellow-600 dark:text-yellow-400'
			};
		return {
			label: m.compass_gap_critical(),
			cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
			valueClass: 'text-red-600 dark:text-red-400'
		};
	});

	function memberStatus(analysis: GapAnalysisResult) {
		const statusKey = gapStatusFor(analysis.gap.realistic, analysis.required_capital_adjusted.realistic);
		if (statusKey === 'on_track')
			return {
				label: m.compass_gap_on_track(),
				cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
			};
		if (statusKey === 'needs_attention')
			return {
				label: m.compass_gap_needs_attention(),
				cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
			};
		return {
			label: m.compass_gap_critical(),
			cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
		};
	}
</script>

{#if summary.count > 0 && realisticDisplay && pessimisticDisplay && optimisticDisplay}
	<div class="bg-card rounded-xl border border-border shadow-sm">
		<!-- Household total -->
		<div class="p-6">
			<div class="flex items-start justify-between mb-4">
				<h2 class="text-lg font-semibold">{m.compass_gap_household_total()}</h2>
				<span class="text-xs px-2.5 py-1 rounded-full font-medium {householdStatus.cls}">
					{householdStatus.label}
				</span>
			</div>

			<div class="space-y-2">
				<div>
					<p class="text-xs text-muted-foreground mb-1">{m.settings_realistic()}</p>
					<p class="text-3xl font-bold {householdStatus.valueClass}">
						{#if realisticDisplay.isSurplus}
							+<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />
							<span class="text-sm font-normal ml-2">{m.compass_gap_surplus()}</span>
						{:else}
							<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />
							<span class="text-sm font-normal ml-2">{m.compass_gap_shortfall()}</span>
						{/if}
					</p>
				</div>

				<div class="flex items-center gap-6 text-sm text-muted-foreground">
					<span>
						{m.settings_pessimistic()}:
						<span class="font-medium text-foreground">
							{#if pessimisticDisplay.isSurplus}+{/if}<FormattedCurrency
								value={pessimisticDisplay.absolute}
								decimals={0}
							/>
						</span>
						<span class="ml-1 text-xs">
							{pessimisticDisplay.isSurplus ? m.compass_gap_surplus() : m.compass_gap_shortfall()}
						</span>
					</span>
					<span>
						{m.settings_optimistic()}:
						<span class="font-medium text-foreground">
							{#if optimisticDisplay.isSurplus}+{/if}<FormattedCurrency
								value={optimisticDisplay.absolute}
								decimals={0}
							/>
						</span>
						<span class="ml-1 text-xs">
							{optimisticDisplay.isSurplus ? m.compass_gap_surplus() : m.compass_gap_shortfall()}
						</span>
					</span>
				</div>
			</div>
		</div>

		<!-- Per-member rows -->
		<div class="border-t border-border">
			{#each members as member, i (member.id)}
				{@const memberAnalysis = analyses[i]}
				{@const gapDisplay = memberAnalysis ? toGapDisplayValue(memberAnalysis.gap.realistic) : null}
				{@const status = memberAnalysis ? memberStatus(memberAnalysis) : null}
				<div
					class="flex items-center justify-between px-6 py-3.5 {i < members.length - 1
						? 'border-b border-border'
						: ''}"
				>
					<!-- Left: dot + name + badge -->
					<div class="flex items-center gap-3">
						<span
							class="w-2 h-2 rounded-full flex-shrink-0 {memberAnalysis
								? 'bg-foreground'
								: 'bg-muted-foreground/40'}"
						></span>
						<span class="text-sm font-medium">{member.first_name} {member.last_name}</span>
						{#if status}
							<span class="text-xs px-2 py-0.5 rounded-full font-medium {status.cls}">
								{status.label}
							</span>
						{:else}
							<span class="text-xs text-muted-foreground">{m.compass_overview_not_configured()}</span>
						{/if}
					</div>

					<!-- Right: gap + capital -->
					{#if memberAnalysis && gapDisplay}
						<div class="flex items-center gap-6">
							<div class="text-right">
								<p class="text-xs text-muted-foreground">{m.compass_overview_monthly_gap()}</p>
								<p
									class="text-sm font-medium {gapDisplay.isSurplus
										? 'text-green-600 dark:text-green-400'
										: ''}"
								>
									{#if gapDisplay.isSurplus}+{/if}<FormattedCurrency
										value={gapDisplay.absolute}
										decimals={0}
									/>
									<span class="text-xs font-normal ml-1">
										{gapDisplay.isSurplus ? m.compass_gap_surplus() : m.compass_gap_shortfall()}
									</span>
								</p>
							</div>
							<div class="text-right hidden sm:block">
								<p class="text-xs text-muted-foreground">{m.compass_overview_capital_retirement()}</p>
								<p class="text-sm font-medium">
									<FormattedCurrency
										value={memberAnalysis.required_capital_adjusted.realistic}
										decimals={0}
									/>
								</p>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
