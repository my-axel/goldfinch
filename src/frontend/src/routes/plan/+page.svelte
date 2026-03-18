<!--
@file src/routes/plan/+page.svelte
@kind route
@purpose Altersvorsorgeplan Übersichtsseite — Haushalt-Zusammenfassung, Timeline-Chart und kompakte Mitglieds-Karten.
-->

<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import GapTimelineChart from '$lib/components/compass/GapTimelineChart.svelte';
	import GapMemberCard from '$lib/components/compass/GapMemberCard.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { aggregateGapAnalyses, gapStatusFor, toGapDisplayValue } from '$lib/utils/retirement-gap';

	let { data } = $props();

	const summary = $derived(aggregateGapAnalyses(data.analyses));
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
</script>

<div class="space-y-6">
	<PageHeader
		title={m.plan_title()}
		description={m.plan_description()}
	/>

	{#if data.members.length === 0}
		<p class="text-muted-foreground text-sm">{m.compass_gap_no_members()}</p>
	{:else}
		<!-- Household hero summary -->
		{#if summary.count > 0 && realisticDisplay}
			<Card title={m.compass_gap_household_total()}>
				<div class="flex items-start justify-between">
					<div class="space-y-2">
						<p class="text-3xl font-bold {householdStatus.valueClass}">
							{#if realisticDisplay.isSurplus}+{/if}<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />
							<span class="text-sm font-normal ml-2">
								{realisticDisplay.isSurplus ? m.compass_gap_surplus() : m.compass_gap_shortfall()}
							</span>
						</p>
						{#if pessimisticDisplay && optimisticDisplay}
							<div class="flex items-center gap-6 text-sm text-muted-foreground">
								<span>
									{m.settings_pessimistic()}:
									<span class="font-medium text-foreground">
										{#if pessimisticDisplay.isSurplus}+{/if}<FormattedCurrency value={pessimisticDisplay.absolute} decimals={0} />
									</span>
								</span>
								<span>
									{m.settings_optimistic()}:
									<span class="font-medium text-foreground">
										{#if optimisticDisplay.isSurplus}+{/if}<FormattedCurrency value={optimisticDisplay.absolute} decimals={0} />
									</span>
								</span>
							</div>
						{/if}
					</div>
					<span class="text-xs px-2.5 py-1 rounded-full font-medium {householdStatus.cls}">
						{householdStatus.label}
					</span>
				</div>
			</Card>
		{/if}

		<!-- Timeline chart — household aggregate, without side panel -->
		{#if data.timelines.some((t: unknown) => t !== null)}
			<Card
				title={m.compass_timeline_title()}
				description={m.compass_timeline_description()}
			>
				<GapTimelineChart
					timelines={data.timelines}
					analyses={data.analyses}
					members={data.members}
					householdOnly={true}
					showSidePanel={false}
				/>
			</Card>
		{/if}

		<!-- Per-member cards -->
		<div>
			<h2 class="text-base font-semibold mb-4">{m.compass_household_summary_title()}</h2>
			<div class="flex flex-wrap gap-4">
				{#each data.members as member, i (member.id)}
					<GapMemberCard
						{member}
						analysis={data.analyses[i] ?? null}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>
