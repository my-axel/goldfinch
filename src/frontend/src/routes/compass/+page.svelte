<!--
@file src/routes/compass/+page.svelte
@kind route
@purpose Kompass Übersichtsseite — Haushalt-Zusammenfassung, Timeline-Chart und kompakte Mitglieds-Karten.
-->

<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import GapOverviewPanel from '$lib/components/compass/GapOverviewPanel.svelte';
	import GapTimelineChart from '$lib/components/compass/GapTimelineChart.svelte';
	import GapMemberCard from '$lib/components/compass/GapMemberCard.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();
</script>

<div class="space-y-6">
	<PageHeader
		title={m.compass_gap_title()}
		description={m.compass_gap_description()}
	/>

	{#if data.members.length === 0}
		<p class="text-muted-foreground text-sm">{m.compass_gap_no_members()}</p>
	{:else}
		<!-- Household overview summary -->
		<GapOverviewPanel analyses={data.analyses} members={data.members} />

		<!-- Timeline chart — household aggregate, no per-member tabs -->
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
