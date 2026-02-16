<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="space-y-6">
	<PageHeader
		title="Payout Strategy"
		description="Plan and optimize your retirement income distribution with smart, adaptive strategies"
	/>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		<Card
			title="Timeline Visualization"
			description="Visualize your retirement income distribution over time"
		>
			<ul class="list-disc pl-4 space-y-2">
				<li class="font-bold">Visual timeline of different payout phases</li>
				<li class="text-muted-foreground">Integration with life events and milestones</li>
				<li class="font-bold">Pension availability markers</li>
				<li class="text-muted-foreground">Age-based planning recommendations</li>
			</ul>
		</Card>

		<Card
			title="Smart Scenario Planning"
			description="Explore different retirement scenarios and their outcomes"
		>
			<ul class="list-disc pl-4 space-y-2">
				<li class="font-bold">Market condition simulations</li>
				<li class="font-bold">Early/late retirement impact analysis</li>
				<li class="text-muted-foreground">Healthcare cost scenarios</li>
				<li class="text-muted-foreground">Lifestyle choice comparisons</li>
			</ul>
		</Card>

		<Card
			title="Dynamic Withdrawal Strategies"
			description="Optimize your withdrawal methods for maximum efficiency"
		>
			<ul class="list-disc pl-4 space-y-2">
				<li class="font-bold">Fixed vs. variable withdrawal methods</li>
				<li class="text-muted-foreground">Required minimum distribution calculations</li>
				<li class="text-muted-foreground">Bucket strategy simulation</li>
				<li class="font-bold">Tax-efficient withdrawal sequencing</li>
			</ul>
		</Card>

		<Card
			title="Adaptive Recommendations"
			description="Receive personalized suggestions based on your situation"
		>
			<ul class="list-disc pl-4 space-y-2">
				<li class="font-bold text-red-800/70">Market-based withdrawal adjustments</li>
				<li class="font-bold text-red-800/70">Spending pattern analysis</li>
				<li class="text-muted-foreground">Tax optimization suggestions</li>
				<li class="text-muted-foreground">Regular strategy review prompts</li>
			</ul>
		</Card>

		<Card
			title="Life Stage Guidance"
			description="Get tailored advice for each retirement phase"
		>
			<ul class="list-disc pl-4 space-y-2">
				<li class="font-bold">Pre-retirement preparation checklist</li>
				<li class="font-bold text-red-800/70">Transition phase recommendations</li>
				<li class="text-muted-foreground">Early retirement years strategy</li>
				<li class="text-muted-foreground">Later retirement years adjustments</li>
			</ul>
		</Card>

		<Card
			title="Portfolio Rebalancing"
			description="Keep your investments aligned with your retirement needs"
		>
			<ul class="list-disc pl-4 space-y-2">
				<li class="font-bold">Age-appropriate asset allocation</li>
				<li class="text-muted-foreground">Tax-loss harvesting opportunities</li>
				<li class="font-bold">Risk level adjustments</li>
				<li class="text-muted-foreground">Market condition-based rebalancing</li>
			</ul>
		</Card>
	</div>

	<div class="mt-8">
		<p class="text-muted-foreground text-sm">
			Coming soon: Enhanced features including social security integration, legacy planning tools,
			and geographic cost-of-living analysis.
		</p>
	</div>
</div>
