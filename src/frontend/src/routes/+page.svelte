<!--
@file src/routes/+page.svelte
@kind route
@purpose Rendert die Route 'dashboard' und verbindet Seitenzustand, Nutzeraktionen und Unterkomponenten.
@contains Das Markup verdrahtet Sektionen, Dialoge und Aktionen fuer den Route-Workflow.
-->

<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import HouseholdSwitcher from '$lib/components/dashboard/HouseholdSwitcher.svelte';
	import RetirementGapCard from '$lib/components/dashboard/RetirementGapCard.svelte';
	import HistoricalPerformanceChart from '$lib/components/pension/etf/HistoricalPerformanceChart.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { pensionStore } from '$lib/stores/pension.svelte';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { pensionApi } from '$lib/api/pension';
	import { PensionType, type ETFPensionStatistics } from '$lib/types/pension';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props();

	// ─── Portfolio Value Derivations ───────────────────────────────────────────

	/** Find the last known value in historical data on or before a given ISO date string */
	function findHistoricalValue(historical: { date: string; value: number }[], targetDate: string): number | null {
		let last: number | null = null;
		for (const p of historical) {
			if (p.date <= targetDate) last = p.value;
			else break;
		}
		return last;
	}

	/** Average monthly contribution derived from total contributions and earliest data date */
	const avgMonthlyContribution = $derived.by(() => {
		const contributions = dashboardStore.seriesData?.metadata?.contributions;
		const earliestDate = dashboardStore.seriesData?.metadata?.earliest_date;
		if (!contributions || !earliestDate) return null;
		const total = Number(contributions.total_to_date);
		if (total <= 0) return null;
		const start = new Date(earliestDate);
		const now = new Date();
		const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
		if (months <= 0) return null;
		return total / months;
	});

	/** MoM and YoY growth rates (in %) derived from historical series data */
	const portfolioGrowth = $derived.by(() => {
		const hist = dashboardStore.seriesData?.historical ?? [];
		if (hist.length < 2) return { mom: null, yoy: null };

		const today = new Date();
		const momDate = new Date(today);
		momDate.setMonth(momDate.getMonth() - 1);
		const yoyDate = new Date(today);
		yoyDate.setFullYear(yoyDate.getFullYear() - 1);

		const momIso = momDate.toISOString().slice(0, 10);
		const yoyIso = yoyDate.toISOString().slice(0, 10);

		// Use sorted historical (should already be sorted asc)
		const sorted = [...hist].sort((a, b) => a.date.localeCompare(b.date));
		const current = dashboardStore.selectedTotal;

		const momVal = findHistoricalValue(sorted, momIso);
		const yoyVal = findHistoricalValue(sorted, yoyIso);

		return {
			mom: momVal && momVal > 0 ? ((current - momVal) / momVal) * 100 : null,
			yoy: yoyVal && yoyVal > 0 ? ((current - yoyVal) / yoyVal) * 100 : null
		};
	});

	let etfStats = $state<ETFPensionStatistics | null>(null);
	let etfStatsLoading = $state(false);

	$effect(() => {
		pensionStore.load();
	});

	// Load series on mount and whenever selected member changes
	$effect(() => {
		// Access selectedMemberId reactively so Svelte tracks this dependency
		const _memberId = dashboardStore.selectedMemberId;
		dashboardStore.loadSeries();
	});

	// ── Temporary debug logging ──────────────────────────────────────────────
	$effect(() => {
		console.log('[Dashboard Debug]', {
			pensionsCount: pensionStore.pensions.length,
			pensionLoading: pensionStore.loading,
			pensionError: pensionStore.error,
			selectedTotal: dashboardStore.selectedTotal,
			seriesLoading: dashboardStore.seriesLoading,
			seriesError: dashboardStore.seriesError,
			seriesHistoricalPoints: dashboardStore.seriesData?.historical.length ?? 'n/a',
			seriesByType: dashboardStore.seriesData ? Object.keys(dashboardStore.seriesData.by_type) : 'n/a',
			seriesMetadata: dashboardStore.seriesData?.metadata ?? 'n/a',
		});
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
				<!-- Portfolio Performance: value + growth + returns -->
				<Card title={m.dashboard_card_performance_title()} description={m.dashboard_card_performance_description()}>
					{#if dashboardStore.loading || pensionStore.pensions.length === 0 && !pensionStore.error}
						<div class="space-y-2 animate-pulse">
							<div class="h-8 bg-muted rounded w-3/4"></div>
							<div class="h-4 bg-muted rounded w-1/2"></div>
							<div class="h-4 bg-muted rounded w-2/3"></div>
						</div>
					{:else if dashboardStore.selectedTotal > 0}
						<p class="text-3xl font-bold tracking-tight">
							{formatCurrency(dashboardStore.selectedTotal, settingsStore.current.number_locale, settingsStore.current.currency, 0)}
						</p>
						<div class="mt-3 space-y-1 text-sm">
							{#if portfolioGrowth.mom !== null}
								<p class={portfolioGrowth.mom >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
									{portfolioGrowth.mom >= 0 ? '+' : ''}{portfolioGrowth.mom.toFixed(1)}% {m.dashboard_portfolio_vs_last_month()}
								</p>
							{/if}
							{#if portfolioGrowth.yoy !== null}
								<p class={portfolioGrowth.yoy >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
									{portfolioGrowth.yoy >= 0 ? '+' : ''}{portfolioGrowth.yoy.toFixed(1)}% {m.dashboard_portfolio_vs_last_year()}
								</p>
							{:else if portfolioGrowth.mom === null}
								<p class="text-muted-foreground text-xs">{m.dashboard_portfolio_add_statements()}</p>
							{/if}
						</div>
						{#if dashboardStore.seriesData?.metadata?.contributions}
							{@const c = dashboardStore.seriesData.metadata.contributions}
							<hr class="my-3 border-border" />
							<div class="space-y-1 text-sm">
								<p class="text-xs text-muted-foreground">{m.dashboard_returns_total_label()}</p>
								<p class="font-semibold {Number(c.total_returns) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
									{Number(c.total_returns) >= 0 ? '+' : ''}{formatCurrency(Number(c.total_returns), settingsStore.current.number_locale, settingsStore.current.currency, 0)}
									{#if c.returns_percentage != null}
										<span class="text-xs font-normal opacity-80">
											({Number(c.returns_percentage) >= 0 ? '+' : ''}{Number(c.returns_percentage).toFixed(1)}%)
										</span>
									{/if}
								</p>
							</div>
						{/if}
						<p class="text-muted-foreground text-xs mt-3">
							{dashboardStore.selectedPensions.length}
							{dashboardStore.selectedPensions.length !== 1 ? m.dashboard_portfolio_plan_plural() : m.dashboard_portfolio_plan_singular()}
						</p>
					{:else if pensionStore.error}
						<p class="text-destructive text-sm">Error: {pensionStore.error}</p>
					{:else}
						<p class="text-muted-foreground text-sm">{m.dashboard_portfolio_no_data()}</p>
					{/if}
				</Card>

				<!-- Contributions -->
				<Card title={m.dashboard_card_contributions_title()} description={m.dashboard_card_contributions_description()}>
					{#if dashboardStore.seriesLoading}
						<div class="space-y-2 animate-pulse">
							<div class="h-8 bg-muted rounded w-3/4"></div>
							<div class="h-4 bg-muted rounded w-1/2"></div>
							<div class="h-4 bg-muted rounded w-2/3"></div>
						</div>
					{:else if dashboardStore.seriesData?.metadata?.contributions}
						{@const c = dashboardStore.seriesData.metadata.contributions}
						<p class="text-3xl font-bold tracking-tight">
							{formatCurrency(Number(c.total_to_date), settingsStore.current.number_locale, settingsStore.current.currency, 0)}
						</p>
						<div class="mt-3 space-y-1 text-sm">
							<p class="text-muted-foreground text-xs">{m.dashboard_contributions_to_date()}</p>
							<p>
								{formatCurrency(Number(c.this_year), settingsStore.current.number_locale, settingsStore.current.currency, 0)}
								<span class="text-muted-foreground text-xs"> {m.dashboard_contributions_this_year()}</span>
							</p>
							{#if avgMonthlyContribution !== null}
								<p class="text-muted-foreground text-xs pt-1">
									Ø {formatCurrency(avgMonthlyContribution, settingsStore.current.number_locale, settingsStore.current.currency, 0)}{m.dashboard_contributions_per_month()}
								</p>
							{/if}
						</div>
					{:else if dashboardStore.seriesError}
						<p class="text-destructive text-sm">{m.dashboard_error_loading()}</p>
					{:else}
						<p class="text-muted-foreground text-sm">{m.dashboard_contributions_no_data()}</p>
					{/if}
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
				<RetirementGapCard />

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
