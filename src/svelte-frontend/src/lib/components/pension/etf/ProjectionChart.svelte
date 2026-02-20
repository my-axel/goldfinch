<!--
@file src/lib/components/pension/etf/ProjectionChart.svelte
@kind component
@purpose Visualisiert Kennzahlen und Verlaeufe im Baustein 'ProjectionChart' fuer den Bereich 'pension'.
@contains Lokaler Komponentenstatus und abgeleitete Werte werden reaktiv im Script-Block verwaltet.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { formatCurrency } from '$lib/utils/format';
	import type { ETFPensionStatistics, ContributionStep } from '$lib/types/pension';
	import { calculateCombinedScenarios } from '$lib/utils/projection';
	import { LineChart, Rule } from 'layerchart';
	import { Expand, Shrink } from '@lucide/svelte';

	let {
		statistics,
		contributionSteps,
		retirementDate,
		loading = false
	}: {
		statistics: ETFPensionStatistics | null;
		contributionSteps: ContributionStep[];
		retirementDate: string | null;
		loading?: boolean;
	} = $props();

	let isExpanded = $state(false);
	const height = $derived(isExpanded ? 600 : 400);

	const locale = $derived(settingsStore.current.number_locale);
	const currency = $derived(settingsStore.current.currency);

	const currencyFmt = $derived.by(() => {
		const _l = locale;
		const _c = currency;
		return (v: any) => formatCurrency(Number(v), _l, _c, 0);
	});

	const dateFmt = $derived.by(() => {
		const _l = locale;
		return (v: any) => new Date(v).toLocaleDateString(_l, { month: 'short', year: '2-digit' });
	});

	const headerDateFmt = $derived.by(() => {
		const _l = locale;
		return (v: any) => new Date(v).toLocaleDateString(_l, { month: 'short', year: 'numeric' });
	});

	interface CombinedChartPoint {
		date: Date;
		historical: number | null;
		contributions: number;
		realistic: number | null;
		pessimistic: number | null;
		optimistic: number | null;
	}

	const today = new Date();
	const retirementDateObj = $derived(retirementDate ? new Date(retirementDate) : null);

	const chartData = $derived.by((): CombinedChartPoint[] => {
		if (!statistics) return [];

		const { value_history, contribution_history } = statistics;
		if (!value_history || value_history.length === 0) return [];

		// Build accumulated contributions map for historical phase
		let historicalAccumulated = 0;
		const contribByMonth = new Map<string, number>();
		[...contribution_history]
			.sort(
				(a, b) =>
					new Date(a.contribution_date).getTime() - new Date(b.contribution_date).getTime()
			)
			.forEach((c) => {
				historicalAccumulated += Number(c.amount);
				const key = new Date(c.contribution_date).toISOString().slice(0, 7); // yyyy-MM
				contribByMonth.set(key, historicalAccumulated);
			});

		// Historical data points
		const sortedHistory = [...value_history].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);

		let runningContrib = 0;
		const historicalPoints: CombinedChartPoint[] = sortedHistory.map((point) => {
			const date = new Date(point.date);
			const key = date.toISOString().slice(0, 7);
			// Find the accumulated contributions up to this month
			const monthContrib = contribByMonth.get(key);
			if (monthContrib !== undefined) runningContrib = monthContrib;
			return {
				date,
				historical: Number(Number(point.value).toFixed(2)),
				contributions: runningContrib,
				realistic: null,
				pessimistic: null,
				optimistic: null
			};
		});

		// Projection data: only if we have a retirement date and contribution steps
		if (!retirementDateObj || retirementDateObj <= today) {
			return historicalPoints;
		}

		const lastHistPoint = sortedHistory[sortedHistory.length - 1];
		const initialValue = Number(lastHistPoint.value);
		const projectionStart = new Date(lastHistPoint.date);
		projectionStart.setMonth(projectionStart.getMonth() + 1);

		const scenarios = calculateCombinedScenarios({
			initialValue,
			contributionSteps,
			rates: {
				pessimistic: settingsStore.current.projection_pessimistic_rate,
				realistic: settingsStore.current.projection_realistic_rate,
				optimistic: settingsStore.current.projection_optimistic_rate
			},
			startDate: projectionStart,
			endDate: retirementDateObj,
			historicalContributions: contribution_history
		});

		const realisticPts = scenarios.scenarios.realistic.dataPoints;
		const pessimisticPts = scenarios.scenarios.pessimistic.dataPoints;
		const optimisticPts = scenarios.scenarios.optimistic.dataPoints;

		const projectionPoints: CombinedChartPoint[] = realisticPts.map((rp, i) => ({
			date: rp.date,
			historical: null,
			contributions: rp.accumulatedContributions ?? runningContrib,
			realistic: rp.value,
			pessimistic: pessimisticPts[i]?.value ?? null,
			optimistic: optimisticPts[i]?.value ?? null
		}));

		return [...historicalPoints, ...projectionPoints].sort(
			(a, b) => a.date.getTime() - b.date.getTime()
		);
	});

	const hasProjection = $derived(chartData.some((d) => d.realistic !== null));

	const series = $derived([
		{
			key: 'historical',
			label: m.etf_historical_value(),
			color: 'var(--chart-1)'
		},
		{
			key: 'contributions',
			label: m.etf_contributions(),
			color: 'var(--chart-2)'
		},
		...(hasProjection
			? [
					{
						key: 'pessimistic',
						label: m.etf_pessimistic(),
						color: 'var(--chart-4)',
						props: { 'stroke-dasharray': '4 4' } as any
					},
					{
						key: 'realistic',
						label: m.etf_realistic(),
						color: 'var(--chart-5)',
						props: { 'stroke-dasharray': '4 4' } as any
					},
					{
						key: 'optimistic',
						label: m.etf_optimistic(),
						color: 'var(--chart-3)',
						props: { 'stroke-dasharray': '4 4' } as any
					}
				]
			: [])
	]);
</script>

<div class="space-y-2">
	<!-- Legend + expand button -->
	<div class="flex flex-wrap items-center justify-end gap-4">
		<div class="flex flex-wrap items-center gap-3">
			{#each series as s}
				<div class="flex items-center gap-1.5">
					<div class="h-3 w-3 rounded-full" style="background-color: {s.color}"></div>
					<span class="text-xs text-muted-foreground">{s.label}</span>
				</div>
			{/each}
		</div>
		<button
			type="button"
			onclick={() => (isExpanded = !isExpanded)}
			class="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
			title={isExpanded ? m.etf_chart_collapse() : m.etf_chart_expand()}
		>
			{#if isExpanded}
				<Shrink class="h-4 w-4" />
			{:else}
				<Expand class="h-4 w-4" />
			{/if}
		</button>
	</div>

	{#if loading}
		<div class="animate-pulse bg-muted rounded-lg" style="height: {height}px"></div>
	{:else if chartData.length === 0}
		<div
			class="flex items-center justify-center text-sm text-muted-foreground"
			style="height: {height}px"
		>
			{contributionSteps.length === 0 ? m.etf_projection_no_steps() : m.etf_historical_no_data()}
		</div>
	{:else}
		<div style="height: {height}px">
			<LineChart
				data={chartData}
				x="date"
				{series}
				legend={false}
				height={height}
				props={{
					yAxis: { format: currencyFmt },
					xAxis: { format: dateFmt },
					tooltip: {
						header: { format: headerDateFmt },
						item: { format: currencyFmt }
					}
				}}
			>
				<svelte:fragment slot="belowMarks">
					<!-- Today reference line -->
					<Rule x={today} stroke-dasharray="4 4" />
					<!-- Retirement reference line -->
					{#if retirementDateObj}
						<Rule x={retirementDateObj} stroke-dasharray="4 4" />
					{/if}
				</svelte:fragment>
			</LineChart>
		</div>
	{/if}
</div>
