<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { formatCurrency } from '$lib/utils/format';
	import type { ETFContributionHistory, ETFValueHistory } from '$lib/types/pension';
	import { LineChart } from 'layerchart';
	import { Expand, Shrink } from '@lucide/svelte';

	let {
		contributionHistory,
		valueHistory,
		loading = false
	}: {
		contributionHistory: ETFContributionHistory[];
		valueHistory: ETFValueHistory[];
		loading?: boolean;
	} = $props();

	let isExpanded = $state(false);
	const height = $derived(isExpanded ? 600 : 300);

	const locale = $derived(settingsStore.current.number_locale);
	const currency = $derived(settingsStore.current.currency);

	interface ChartDataPoint {
		date: Date;
		contributions: number;
		value: number;
	}

	const chartData = $derived.by((): ChartDataPoint[] => {
		try {
			let accumulated = 0;
			const contributionPoints = new Map<string, number>();

			[...contributionHistory]
				.sort(
					(a, b) =>
						new Date(a.contribution_date).getTime() - new Date(b.contribution_date).getTime()
				)
				.forEach((c) => {
					const amount = Number(c.amount);
					if (!isNaN(amount)) {
						accumulated += amount;
						const key = new Date(c.contribution_date).toLocaleDateString(locale, {
							month: 'short',
							year: 'numeric'
						});
						contributionPoints.set(key, accumulated);
					}
				});

			return [...valueHistory]
				.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
				.map((point) => {
					const date = new Date(point.date);
					const key = date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
					return {
						date,
						contributions: contributionPoints.get(key) ?? accumulated,
						value: Number(Number(point.value).toFixed(2))
					};
				});
		} catch {
			return [];
		}
	});

	const series = $derived([
		{
			key: 'contributions',
			label: m.etf_contributions(),
			color: 'var(--chart-2)'
		},
		{
			key: 'value',
			label: m.etf_historical_value(),
			color: 'var(--chart-1)'
		}
	]);

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
</script>

<div class="space-y-2">
	<!-- Legend + expand button -->
	<div class="flex items-center justify-end gap-4">
		<div class="flex items-center gap-3">
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
	{:else if chartData.length < 2}
		<div
			class="flex items-center justify-center text-sm text-muted-foreground"
			style="height: {height}px"
		>
			{m.etf_historical_no_data()}
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
			/>
		</div>
	{/if}
</div>
