<!--
@file src/lib/components/dashboard/RetirementStatusBanner.svelte
@kind component
@purpose Compact retirement status card for dashboard — shows traffic light, 3 scenarios, and progress bar.
-->

<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import { compassApi } from '$lib/api/compass';
	import {
		aggregateGapAnalyses,
		gapStatusFor,
		normalizeGapAnalysis,
		toGapDisplayValue
	} from '$lib/utils/retirement-gap';

	interface StatusData {
		pessimistic: number;
		realistic: number;
		optimistic: number;
		totalRequired: number;
		projectedCapital: number;
		requiredCapital: number;
	}

	let data = $state<StatusData | null>(null);
	let loading = $state(false);
	let requestSeq = 0;

	async function loadData(memberId: number | undefined) {
		const reqId = ++requestSeq;
		loading = true;
		try {
			if (memberId === undefined) {
				const configs = await compassApi.getAllConfigs();
				const analyses = await Promise.all(
					configs.map(async (config) => {
						try {
							return await compassApi.getAnalysis(config.member_id);
						} catch {
							return null;
						}
					})
				);
				const aggregate = aggregateGapAnalyses(analyses);
				if (reqId !== requestSeq) return;
				if (aggregate.count > 0) {
					const validAnalyses = analyses.filter((a) => a !== null);
					const projectedCapital = validAnalyses.reduce(
						(s, a) => s + Number(a!.projected_capital.realistic),
						0
					);
					const requiredCapital = validAnalyses.reduce(
						(s, a) => s + Number(a!.required_capital_adjusted.realistic),
						0
					);
					data = {
						pessimistic: aggregate.totals.pessimistic,
						realistic: aggregate.totals.realistic,
						optimistic: aggregate.totals.optimistic,
						totalRequired: aggregate.totalRequired,
						projectedCapital,
						requiredCapital
					};
				} else {
					data = null;
				}
				return;
			}

			try {
				const analysis = await compassApi.getAnalysis(memberId);
				const normalized = normalizeGapAnalysis(analysis);
				if (reqId !== requestSeq) return;
				if (normalized) {
					data = {
						pessimistic: normalized.pessimistic,
						realistic: normalized.realistic,
						optimistic: normalized.optimistic,
						totalRequired: normalized.requiredCapitalAdjusted,
						projectedCapital: Number(analysis.projected_capital.realistic),
						requiredCapital: Number(analysis.required_capital_adjusted.realistic)
					};
				} else {
					data = null;
				}
			} catch {
				if (reqId !== requestSeq) return;
				data = null;
			}
		} finally {
			if (reqId === requestSeq) loading = false;
		}
	}

	$effect(() => {
		loadData(dashboardStore.selectedMemberId);
	});

	const status = $derived.by(() => {
		if (!data) return null;
		const key = gapStatusFor(data.realistic, data.totalRequired);
		if (key === 'on_track')
			return {
				label: m.compass_gap_on_track(),
				cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
				dotCls: 'bg-green-500'
			};
		if (key === 'needs_attention')
			return {
				label: m.compass_gap_needs_attention(),
				cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
				dotCls: 'bg-yellow-500'
			};
		return {
			label: m.compass_gap_critical(),
			cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
			dotCls: 'bg-red-500'
		};
	});

	const pessimisticDisplay = $derived(data ? toGapDisplayValue(data.pessimistic) : null);
	const realisticDisplay = $derived(data ? toGapDisplayValue(data.realistic) : null);
	const optimisticDisplay = $derived(data ? toGapDisplayValue(data.optimistic) : null);

	const progressPct = $derived.by(() => {
		if (!data || data.requiredCapital <= 0) return 100;
		return Math.min(100, Math.round((data.projectedCapital / data.requiredCapital) * 100));
	});
</script>

<Card title={m.dashboard_status_title()} description={m.dashboard_status_description()}>
	{#if loading && !data}
		<div class="space-y-2 animate-pulse">
			<div class="h-6 bg-muted rounded w-1/2"></div>
			<div class="h-4 bg-muted rounded w-3/4"></div>
			<div class="h-3 bg-muted rounded w-full"></div>
		</div>
	{:else if data && status && realisticDisplay}
		<!-- Status + link row -->
		<div class="flex items-center justify-between mb-4">
			<span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium {status.cls}">
				<span class="w-2 h-2 rounded-full {status.dotCls}"></span>
				{status.label}
			</span>
			<a
				href="/plan"
				class="text-xs font-medium text-primary hover:underline"
			>
				{m.dashboard_status_view_details()}
			</a>
		</div>

		<!-- 3 scenarios row -->
		<div class="grid grid-cols-3 gap-2 text-center mb-4">
			{#if pessimisticDisplay}
				<div>
					<div class="text-[10px] text-muted-foreground uppercase tracking-wide">{m.settings_pessimistic()}</div>
					<div class="text-sm font-semibold tabular-nums mt-0.5">
						{pessimisticDisplay.isSurplus ? '+' : '-'}<FormattedCurrency value={pessimisticDisplay.absolute} decimals={0} />/mo
					</div>
				</div>
			{/if}
			{#if realisticDisplay}
				<div>
					<div class="text-[10px] text-muted-foreground uppercase tracking-wide">{m.settings_realistic()}</div>
					<div class="text-sm font-bold tabular-nums mt-0.5">
						{realisticDisplay.isSurplus ? '+' : '-'}<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />/mo
					</div>
				</div>
			{/if}
			{#if optimisticDisplay}
				<div>
					<div class="text-[10px] text-muted-foreground uppercase tracking-wide">{m.settings_optimistic()}</div>
					<div class="text-sm font-semibold tabular-nums mt-0.5">
						{optimisticDisplay.isSurplus ? '+' : '-'}<FormattedCurrency value={optimisticDisplay.absolute} decimals={0} />/mo
					</div>
				</div>
			{/if}
		</div>

		<!-- Progress bar: Required vs Projected -->
		<div class="space-y-1.5">
			<div class="flex justify-between text-[10px] text-muted-foreground">
				<span>{m.dashboard_status_required_label()}</span>
				<span>{m.dashboard_status_projected_label()}</span>
			</div>
			<div class="h-2.5 rounded-full bg-muted overflow-hidden">
				<div
					class="h-full rounded-full transition-all duration-500 {progressPct >= 100 ? 'bg-green-500' : progressPct >= 75 ? 'bg-yellow-500' : 'bg-red-500'}"
					style="width: {progressPct}%"
				></div>
			</div>
			<div class="flex justify-between text-xs tabular-nums text-muted-foreground">
				<span><FormattedCurrency value={data.requiredCapital} decimals={0} /></span>
				<span><FormattedCurrency value={data.projectedCapital} decimals={0} /></span>
			</div>
		</div>
	{:else}
		<!-- No data / not configured -->
		<p class="text-sm text-muted-foreground mb-3">{m.dashboard_status_no_data()}</p>
		<a
			href="/plan"
			class="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
		>
			{m.dashboard_status_setup_cta()}
		</a>
	{/if}
</Card>
