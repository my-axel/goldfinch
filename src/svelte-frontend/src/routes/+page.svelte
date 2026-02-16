<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="space-y-6">
	<PageHeader
		title="Dashboard"
		description="Complete overview of your retirement journey – past achievements and future possibilities"
	/>

	<!-- Main content container -->
	<div class="grid grid-cols-1 md:grid-cols-13 gap-6">
		<!-- Left Column - Current Position & History -->
		<div class="md:col-span-6 space-y-6">
			<h2 class="text-2xl font-bold tracking-tight">Current Position & History</h2>

			<!-- Key Metrics -->
			<div class="grid gap-4 grid-cols-2">
				<Card title="Total Portfolio Value" description="Quick overview of your current position">
					<ul class="list-disc pl-4 space-y-2 text-sm">
						<li class="font-bold">Total value across all pension plans</li>
						<li class="font-bold">Month/Year-over-Year growth rates</li>
						<li class="text-muted-foreground">Distribution pie chart by pension type</li>
						<li class="text-muted-foreground">Sparkline showing recent trend</li>
					</ul>
				</Card>

				<Card title="Total Contributions" description="Your investment commitment">
					<ul class="list-disc pl-4 space-y-2 text-sm">
						<li class="font-bold">Total contributions to date</li>
						<li class="font-bold">This year's contributions</li>
						<li class="text-muted-foreground">Average monthly contribution</li>
						<li class="text-muted-foreground">Contribution streak/consistency</li>
					</ul>
				</Card>

				<Card title="Investment Returns" description="What your money has earned">
					<ul class="list-disc pl-4 space-y-2 text-sm">
						<li class="font-bold">Total returns earned</li>
						<li class="font-bold">Return percentage (XIRR)</li>
						<li class="text-muted-foreground">Best performing plan</li>
						<li class="text-muted-foreground">This year's earnings</li>
					</ul>
				</Card>

				<Card title="Quick Actions" description="Common tasks and updates">
					<ul class="list-disc pl-4 space-y-2 text-sm">
						<li class="font-bold">Record new contribution</li>
						<li class="font-bold">Update plan values</li>
						<li class="text-muted-foreground">Run health check</li>
						<li class="text-muted-foreground">View recent changes</li>
					</ul>
				</Card>
			</div>

			<!-- Historical Charts -->
			<div class="space-y-4">
				<Card title="Contributions vs Returns" description="Growth breakdown over time">
					<div class="h-[300px]">
						<ul class="list-disc pl-4 space-y-2">
							<li class="text-muted-foreground">Stacked area chart showing:</li>
							<ul class="list-[circle] pl-4 space-y-1">
								<li class="text-muted-foreground">Total contributions (bottom)</li>
								<li class="text-muted-foreground">Market returns (top)</li>
								<li class="text-muted-foreground">Monthly/yearly toggle</li>
							</ul>
							<li class="text-muted-foreground">Hover for detailed values</li>
							<li class="text-muted-foreground">Highlight significant events</li>
							<li class="text-muted-foreground">Show contribution patterns</li>
						</ul>
					</div>
				</Card>

				<Card title="Plan Performance Comparison" description="How each plan has performed">
					<div class="h-[300px]">
						<ul class="list-disc pl-4 space-y-2">
							<li class="text-muted-foreground">Multi-line chart showing:</li>
							<ul class="list-[circle] pl-4 space-y-1">
								<li class="text-muted-foreground">Individual plan growth</li>
								<li class="text-muted-foreground">Toggle absolute/percentage view</li>
								<li class="text-muted-foreground">Plan type grouping</li>
							</ul>
							<li class="text-muted-foreground">Highlight specific plans</li>
							<li class="text-muted-foreground">Performance metrics table</li>
							<li class="text-muted-foreground">Risk/return comparison</li>
						</ul>
					</div>
				</Card>
			</div>
		</div>

		<!-- Middle Column - Today divider (hidden on mobile) -->
		<div class="hidden md:block md:col-span-1 text-center relative h-full">
			<h2
				class="text-sm font-medium text-muted-foreground uppercase tracking-wider h-10 flex items-center justify-center"
			>
				Today
			</h2>
			<div class="h-full flex justify-center mt-4">
				<div class="w-px bg-border h-full"></div>
			</div>
		</div>

		<!-- Right Column - Future Projections -->
		<div class="md:col-span-6 space-y-6">
			<h2 class="text-2xl font-bold tracking-tight text-right">Future Projections</h2>

			<div class="space-y-4">
				<Card title="Retirement Goal Progress" description="Track your journey to retirement">
					<ul class="list-disc pl-4 space-y-2">
						<li class="text-muted-foreground">Visual progress gauge showing:</li>
						<ul class="list-[circle] pl-4 space-y-1">
							<li class="font-bold">Current vs target amount</li>
							<li class="font-bold">Projected completion date</li>
							<li class="font-bold">Monthly target to stay on track</li>
						</ul>
						<li class="text-muted-foreground">Integration with Pension Health</li>
						<li class="text-muted-foreground">Adjustable goal settings</li>
						<li class="text-muted-foreground">Quick action recommendations</li>
					</ul>
				</Card>

				<Card title="Scenario Analysis" description="Explore possible futures">
					<ul class="list-disc pl-4 space-y-2">
						<li class="text-muted-foreground">Area chart showing scenarios:</li>
						<ul class="list-[circle] pl-4 space-y-1">
							<li class="text-muted-foreground">Conservative (lower bound)</li>
							<li class="font-bold">Expected (middle path)</li>
							<li class="text-muted-foreground">Optimistic (upper bound)</li>
						</ul>
						<li class="text-muted-foreground">Adjustable assumptions</li>
						<li class="text-muted-foreground">Risk factor highlighting</li>
						<li class="text-muted-foreground">Integration with Payout Strategy</li>
					</ul>
				</Card>

				<!-- Additional Insights -->
				<div class="grid gap-4 grid-cols-1">
					<Card title="Action Items" description="Improve your outlook">
						<ul class="list-disc pl-4 space-y-2 text-sm">
							<li class="font-bold text-red-800/70">Personalized recommendations</li>
							<li class="text-muted-foreground">Quick wins identification</li>
							<li class="text-muted-foreground">Risk mitigation steps</li>
							<li class="text-muted-foreground">Links to relevant tools</li>
						</ul>
					</Card>

					<Card title="Market Context" description="External factors to consider">
						<ul class="list-disc pl-4 space-y-2 text-sm">
							<li class="text-muted-foreground">Current market conditions</li>
							<li class="text-muted-foreground">Interest rate impact</li>
							<li class="text-muted-foreground">Inflation considerations</li>
							<li class="text-muted-foreground">Economic indicators</li>
						</ul>
					</Card>
				</div>
			</div>
		</div>
	</div>
</div>
