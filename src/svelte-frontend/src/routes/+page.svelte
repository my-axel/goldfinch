<!--
@file src/routes/+page.svelte
@kind route
@purpose Rendert die Route 'dashboard' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
@contains Das Markup verdrahtet Sektionen, Dialoge und Aktionen fuer den Route-Workflow.
-->

<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import HouseholdSwitcher from '$lib/components/dashboard/HouseholdSwitcher.svelte';
	import HistoricalPerformanceChart from '$lib/components/pension/etf/HistoricalPerformanceChart.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionStore } from '$lib/stores/pension.svelte';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import { pensionApi } from '$lib/api/pension';
	import { PensionType, type ETFPensionStatistics } from '$lib/types/pension';

	let { data } = $props();

	let etfStats = $state<ETFPensionStatistics | null>(null);
	let etfStatsLoading = $state(false);

	$effect(() => {
		pensionStore.load();
	});

	$effect(() => {
		const etfPensions = dashboardStore.selectedPensions.filter(
			(p) => p.type === PensionType.ETF_PLAN
		);
		if (etfPensions.length === 0) {
			etfStats = null;
			etfStatsLoading = false;
			return;
		}
		etfStatsLoading = true;
		Promise.all(etfPensions.map((p) => pensionApi.getETFPensionStatistics(p.id)))
			.then((allStats) => {
				if (allStats.length === 1) {
					etfStats = allStats[0];
					return;
				}
				// Merge contribution histories (chart will sort & accumulate them)
				const contributionHistory = allStats.flatMap((s) => s.contribution_history);
				// Merge value histories: group by date, sum values across plans
				const valueMap = new Map<string, number>();
				for (const s of allStats) {
					for (const v of s.value_history) {
						valueMap.set(v.date, (valueMap.get(v.date) ?? 0) + Number(v.value));
					}
				}
				const valueHistory = Array.from(valueMap.entries())
					.map(([date, value]) => ({ date, value }))
					.sort((a, b) => a.date.localeCompare(b.date));
				etfStats = {
					total_invested_amount: allStats.reduce((s, x) => s + x.total_invested_amount, 0),
					current_value: allStats.reduce((s, x) => s + x.current_value, 0),
					total_return: allStats.reduce((s, x) => s + x.total_return, 0),
					contribution_history: contributionHistory,
					value_history: valueHistory
				};
			})
			.catch(() => {
				etfStats = null;
			})
			.finally(() => {
				etfStatsLoading = false;
			});
	});
</script>

<div class="space-y-6">
	<div class="flex items-end justify-between gap-4 mb-8">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{m.dashboard_title()}</h1>
			<p class="text-muted-foreground mt-2">{m.dashboard_description()}</p>
		</div>
		<HouseholdSwitcher members={data.members} bind:selectedMemberId={dashboardStore.selectedMemberId} />
	</div>

	<!-- Main content container -->
	<div class="grid grid-cols-1 md:grid-cols-13 gap-6">
		<!-- Left Column - Current Position & History -->
		<div class="md:col-span-6 space-y-6">
			<h2 class="text-2xl font-bold tracking-tight">{m.dashboard_current_position()}</h2>

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
				<Card title="ETF — Contributions vs Returns" description="Historical performance of your ETF plan">
					<HistoricalPerformanceChart
						contributionHistory={etfStats?.contribution_history ?? []}
						valueHistory={etfStats?.value_history ?? []}
						loading={etfStatsLoading || dashboardStore.loading}
					/>
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
				{m.dashboard_today()}
			</h2>
			<div class="h-full flex justify-center mt-4">
				<div class="w-px bg-border h-full"></div>
			</div>
		</div>

		<!-- Right Column - Future Projections -->
		<div class="md:col-span-6 space-y-6">
			<h2 class="text-2xl font-bold tracking-tight text-right">{m.dashboard_future_projections()}</h2>

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
