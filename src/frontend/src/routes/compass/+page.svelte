<!--
@file src/routes/compass/+page.svelte
@kind route
@purpose Kompass page — interactive retirement gap analysis per household member.
-->

<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import GapHouseholdSummary from '$lib/components/compass/GapHouseholdSummary.svelte';
	import GapMemberSection from '$lib/components/compass/GapMemberSection.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();

	// Look up config by member id (gapConfigs is page-load data)
	function getConfig(memberId: number) {
		return data.gapConfigs.find((c: { member_id: number }) => c.member_id === memberId) ?? null;
	}
</script>

<div class="space-y-6">
	<PageHeader
		title={m.compass_gap_title()}
		description={m.compass_gap_description()}
	/>

	{#if data.members.length === 0}
		<p class="text-muted-foreground text-sm">{m.compass_gap_no_members()}</p>
	{:else}
		<!-- Household Summary (only shown when at least one member has analysis) -->
		<GapHouseholdSummary analyses={data.analyses} />

		<!-- Per-member sections -->
		<div class="space-y-4">
			{#each data.members as member, i (member.id)}
				<GapMemberSection
					{member}
					config={getConfig(member.id)}
					analysis={data.analyses[i]}
				/>
			{/each}
		</div>
	{/if}

	<!-- Roadmap Cards — existing placeholders remain as feature outlook -->
	<div class="border-t border-border pt-6">
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<Card
				title="Gap Analysis"
				description="Calculate and visualize the difference between your needed and current pension"
			>
				<ul class="list-disc pl-4 space-y-2">
					<li class="font-bold flex items-center gap-2">
						<span class="text-green-600">✓</span> Enter your current wage for baseline calculations
					</li>
					<li class="font-bold flex items-center gap-2">
						<span class="text-green-600">✓</span> View your pension gap with real-time updates
					</li>
					<li class="text-muted-foreground">Automatic integration with household member data</li>
					<li class="font-bold flex items-center gap-2">
						<span class="text-green-600">✓</span> Compare with your existing pension plans
					</li>
				</ul>
			</Card>

			<Card
				title="Smart Recommendations"
				description="Get personalized suggestions to improve your pension health"
			>
				<ul class="list-disc pl-4 space-y-2">
					<li class="font-bold text-red-800/70">Actionable steps to close your pension gap</li>
					<li class="font-bold">Risk level assessment</li>
					<li class="font-bold text-red-800/70">Savings adjustment recommendations</li>
					<li class="text-muted-foreground">Investment strategy suggestions</li>
				</ul>
			</Card>

			<Card
				title="Interactive Planning"
				description="Explore different scenarios and their impact on your retirement"
			>
				<ul class="list-disc pl-4 space-y-2">
					<li class="font-bold">Adjust retirement age to see immediate impact</li>
					<li class="text-muted-foreground">Toggle between lifestyle scenarios</li>
					<li class="text-muted-foreground">Explore "What if" scenarios</li>
					<li class="font-bold">View projected timeline visualization</li>
				</ul>
			</Card>
		</div>
	</div>
</div>
