<!--
@file src/lib/components/pension/etf/HistoricalPerformanceChart.svelte
@kind component
@purpose Visualisiert den historischen Wertverlauf und akkumulierte Beiträge eines ETF-Pensionsplans.
@contains Lokaler Komponentenstatus und abgeleitete Werte werden reaktiv im Script-Block verwaltet.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { formatCurrency } from '$lib/utils/format';
	import type { ETFContributionHistory, ETFValueHistory, HistoricalDataPoint } from '$lib/types/pension';
	import { Chart } from 'svelte-echarts';
	import { init, graphic } from 'echarts';
	import { Expand, Shrink } from '@lucide/svelte';

	let {
		contributionHistory,
		valueHistory,
		savingsHistory = [],
		loading = false
	}: {
		contributionHistory: ETFContributionHistory[];
		valueHistory: ETFValueHistory[];
		savingsHistory?: HistoricalDataPoint[];
		loading?: boolean;
	} = $props();

	let isExpanded = $state(false);
	const height = $derived(isExpanded ? 600 : 300);

	const locale = $derived(settingsStore.current.number_locale);
	const currency = $derived(settingsStore.current.currency);

	const currencyFmt = $derived.by(() => {
		const _l = locale;
		const _c = currency;
		return (v: any) => formatCurrency(Number(v), _l, _c, 0);
	});

	const headerDateFmt = $derived.by(() => {
		const _l = locale;
		return (v: any) => new Date(v).toLocaleDateString(_l, { month: 'short', year: 'numeric' });
	});

	interface ChartDataPoint {
		date: Date;
		contributions: number;
		value: number;
	}

	const chartData = $derived.by((): ChartDataPoint[] => {
		try {
			// Sort both lists by date ascending
			const sortedContribs = [...contributionHistory].sort(
				(a, b) =>
					new Date(a.contribution_date).getTime() - new Date(b.contribution_date).getTime()
			);
			const sortedValues = [...valueHistory].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
			);

			// Walk through value points and accumulate contributions up to each point's date
			let contribIdx = 0;
			let runningContribs = 0;

			return sortedValues.map((point) => {
				const date = new Date(point.date);
				const pointTs = date.getTime();

				while (contribIdx < sortedContribs.length) {
					const contribTs = new Date(sortedContribs[contribIdx].contribution_date).getTime();
					if (contribTs <= pointTs) {
						const amount = Number(sortedContribs[contribIdx].amount);
						if (!isNaN(amount)) runningContribs += amount;
						contribIdx++;
					} else {
						break;
					}
				}

				return {
					date,
					contributions: runningContribs,
					value: Number(Number(point.value).toFixed(2))
				};
			});
		} catch {
			return [];
		}
	});

	const chartColors = {
		value: 'hsl(263, 70%, 50%)',
		contributions: 'hsl(173, 58%, 45%)',
		savings: 'hsl(35, 85%, 50%)'
	} as const;

	// Theme-aware colors
	const isDark = $derived.by(() => {
		const t = themeStore.current;
		if (!browser) return false;
		if (t === 'light') return false;
		if (t === 'dark') return true;
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	});

	const themeColors = $derived.by(() => {
		const dark = isDark;
		return dark
			? {
					tooltipBg: 'hsl(0, 0%, 11%)',
					tooltipBorder: 'hsl(0, 0%, 15%)',
					tooltipText: 'hsl(210, 20%, 98%)',
					axisLabel: 'hsl(0, 0%, 63%)',
					splitLine: 'hsl(0, 0%, 18%)',
					axisLine: 'hsl(0, 0%, 15%)'
				}
			: {
					tooltipBg: 'hsl(0, 0%, 100%)',
					tooltipBorder: 'hsl(0, 0%, 89%)',
					tooltipText: 'hsl(0, 0%, 9%)',
					axisLabel: 'hsl(0, 0%, 45%)',
					splitLine: 'hsl(0, 0%, 89%)',
					axisLine: 'hsl(0, 0%, 89%)'
				};
	});

	const echartsOptions = $derived.by(() => {
		const _l = locale;
		const _fmt = currencyFmt;
		const _headerDateFmt = headerDateFmt;
		const tc = themeColors;

		const valueData = chartData.map((d) => [d.date.getTime(), d.value] as [number, number]);
		const contributionsData = chartData.map(
			(d) => [d.date.getTime(), d.contributions] as [number, number]
		);
		const savingsData = savingsHistory
			.slice()
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((d) => [new Date(d.date).getTime(), Number(d.value)] as [number, number]);

		const xMin = Math.min(
			...valueData.map((d) => d[0]),
			...contributionsData.map((d) => d[0]),
			...(savingsData.length > 1 ? savingsData.map((d) => d[0]) : [])
		) || undefined;

		const withAlpha = (hsl: string, alpha: number) =>
			hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);

		const makeStackedSeries = (
			name: string,
			data: [number, number][],
			color: string,
			areaOpacity: number,
			showLine = true
		) => ({
			name,
			type: 'line',
			stack: 'total',
			data,
			itemStyle: { color, borderWidth: 0 },
			lineStyle: { width: showLine ? 2 : 0, color },
			areaStyle: {
				color: new graphic.LinearGradient(0, 0, 0, 1, [
					{ offset: 0, color: withAlpha(color, areaOpacity) },
					{ offset: 1, color: withAlpha(color, 0) }
				])
			},
			showSymbol: false,
			smooth: true
		});

		const makeReferenceLine = (
			name: string,
			data: [number, number][],
			color: string
		) => ({
			name,
			type: 'line',
			data,
			itemStyle: { color, borderWidth: 0 },
			lineStyle: { width: 1.5, color, type: 'dashed' as const },
			showSymbol: false,
			smooth: true
		});

		return {
			backgroundColor: 'transparent',
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'line' },
				backgroundColor: tc.tooltipBg,
				borderColor: tc.tooltipBorder,
				textStyle: { color: tc.tooltipText },
				formatter: (params: any[]) => {
					if (!params || params.length === 0) return '';
					const ts = params[0].value[0];
					const dateStr = _headerDateFmt(new Date(ts));
					let html = `<div style="font-weight:600;margin-bottom:6px">${dateStr}</div>`;
					for (const p of params) {
						if (p.value[1] == null) continue;
						const val = _fmt(p.value[1]);
						html += `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:3px">
							<span style="display:flex;align-items:center;gap:6px">
								<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
								${p.seriesName}
							</span>
							<span style="font-weight:500">${val}</span>
						</div>`;
					}
					return html;
				}
			},
			grid: { top: 12, right: 12, bottom: 58, left: 80 },
			xAxis: {
				type: 'time' as const,
				minInterval: 60 * 24 * 3600 * 1000,
				...(xMin !== undefined ? { min: xMin } : {}),
				axisLabel: {
					hideOverlap: true,
					rotate: -45,
					color: tc.axisLabel,
					formatter: (val: number) => {
						const d = new Date(val);
						if (d.getMonth() === 0) {
							return d.getFullYear().toString();
						}
						return d.toLocaleDateString(_l, { month: 'short' });
					}
				},
				axisLine: { lineStyle: { color: tc.axisLine } },
				splitLine: { lineStyle: { color: tc.splitLine } }
			},
			yAxis: {
				type: 'value' as const,
				axisLabel: {
					formatter: (val: number) => _fmt(val),
					color: tc.axisLabel
				},
				axisLine: { show: false },
				splitLine: { lineStyle: { color: tc.splitLine } }
			},
			series: [
				makeStackedSeries(m.etf_historical_value(), valueData, chartColors.value, 0.35),
				...(savingsData.length > 1 ? [makeStackedSeries(m.dashboard_chart_savings_balance(), savingsData, chartColors.savings, 0.3, false)] : []),
				makeReferenceLine(m.etf_contributions(), contributionsData, chartColors.contributions)
			]
		};
	});
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full" style="background-color: {chartColors.value}"></div>
				<span class="text-xs text-muted-foreground">{m.etf_historical_value()}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full" style="background-color: {chartColors.contributions}"></div>
				<span class="text-xs text-muted-foreground">{m.etf_contributions()}</span>
			</div>
			{#if savingsHistory.length > 1}
				<div class="flex items-center gap-1.5">
					<div class="h-3 w-3 rounded-full" style="background-color: {chartColors.savings}"></div>
					<span class="text-xs text-muted-foreground">{m.dashboard_chart_savings_balance()}</span>
				</div>
			{/if}
		</div>
		<button
			type="button"
			onclick={() => (isExpanded = !isExpanded)}
			class="h-8 w-8 shrink-0 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
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
	{:else if chartData.length === 0 && savingsHistory.length <= 1}
		<div
			class="flex items-center justify-center text-sm text-muted-foreground"
			style="height: {height}px"
		>
			{m.etf_historical_no_data()}
		</div>
	{:else}
		<div style="height: {height}px">
			<Chart {init} options={echartsOptions as any} />
		</div>
	{/if}
</div>
