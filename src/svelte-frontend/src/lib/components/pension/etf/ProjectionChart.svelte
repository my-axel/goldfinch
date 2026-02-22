<!--
@file src/lib/components/pension/etf/ProjectionChart.svelte
@kind component
@purpose Visualisiert historischen Wertverlauf und Zukunftsprojektion (pessimistisch/realistisch/optimistisch) für einen ETF-Pensionsplan.
@contains Lokaler Komponentenstatus und abgeleitete Werte werden reaktiv im Script-Block verwaltet.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { formatCurrency } from '$lib/utils/format';
	import type { ETFPensionStatistics, ContributionStep } from '$lib/types/pension';
	import { calculateCombinedScenarios } from '$lib/utils/projection';
	import { Chart } from 'svelte-echarts';
	import { init, graphic } from 'echarts';
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

	const headerDateFmt = $derived.by(() => {
		const _l = locale;
		return (v: any) => new Date(v).toLocaleDateString(_l, { month: 'short', year: 'numeric' });
	});

	interface CombinedChartPoint {
		date: Date;
		historical: number | null;
		contributions: number;
		contributionAmount: number;
		realistic: number | null;
		pessimistic: number | null;
		optimistic: number | null;
	}

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

	const today = new Date();
	const retirementDateObj = $derived(retirementDate ? new Date(retirementDate) : null);

	const chartData = $derived.by((): CombinedChartPoint[] => {
		if (!statistics) return [];

		const { value_history, contribution_history } = statistics;
		if (!value_history || value_history.length === 0) return [];

		// Sort contributions by date for running accumulation
		const sortedContribs = [...contribution_history].sort(
			(a, b) =>
				new Date(a.contribution_date).getTime() - new Date(b.contribution_date).getTime()
		);

		// Per-month totals used for tooltip display only
		const monthlyContribByMonth = new Map<string, number>();
		sortedContribs.forEach((c) => {
			const key = new Date(c.contribution_date).toISOString().slice(0, 7);
			monthlyContribByMonth.set(key, (monthlyContribByMonth.get(key) ?? 0) + Number(c.amount));
		});

		const sortedHistory = [...value_history].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);

		// Walk contributions and value_history in parallel by timestamp so contributions
		// made BEFORE the first available price point are still counted correctly.
		let contribIdx = 0;
		let runningContrib = 0;
		const historicalPoints: CombinedChartPoint[] = sortedHistory.map((point) => {
			const date = new Date(point.date);
			const pointTs = date.getTime();
			const key = date.toISOString().slice(0, 7);
			while (contribIdx < sortedContribs.length) {
				const contribTs = new Date(sortedContribs[contribIdx].contribution_date).getTime();
				if (contribTs <= pointTs) {
					runningContrib += Number(sortedContribs[contribIdx].amount);
					contribIdx++;
				} else {
					break;
				}
			}
			return {
				date,
				historical: Number(Number(point.value).toFixed(2)),
				contributions: runningContrib,
				contributionAmount: monthlyContribByMonth.get(key) ?? 0,
				realistic: null,
				pessimistic: null,
				optimistic: null
			};
		});

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
			contributionAmount: rp.contributionAmount ?? 0,
			realistic: rp.value,
			pessimistic: pessimisticPts[i]?.value ?? null,
			optimistic: optimisticPts[i]?.value ?? null
		}));

		return [...historicalPoints, ...projectionPoints].sort(
			(a, b) => a.date.getTime() - b.date.getTime()
		);
	});

	const chartColors = {
		historical: 'hsl(263, 70%, 50%)',
		contributions: 'hsl(173, 58%, 45%)',
		optimistic: 'hsl(30, 80%, 55%)',
		pessimistic: 'hsl(320, 65%, 60%)',
		realistic: 'hsl(15, 75%, 55%)'
	} as const;

	const hasProjection = $derived(chartData.some((d) => d.realistic !== null));

	const legendItems = $derived([
		{ label: m.etf_historical_value(), color: chartColors.historical },
		{ label: m.etf_contributions(), color: chartColors.contributions },
		...(hasProjection
			? [
					{ label: m.etf_pessimistic(), color: chartColors.pessimistic },
					{ label: m.etf_realistic(), color: chartColors.realistic },
					{ label: m.etf_optimistic(), color: chartColors.optimistic }
				]
			: [])
	]);

	const echartsOptions = $derived.by(() => {
		const _l = locale;
		const _fmt = currencyFmt;
		const _headerDateFmt = headerDateFmt;
		const _retirementDateObj = retirementDateObj;
		const _hasProjection = hasProjection;
		const tc = themeColors;

		const historicalData = chartData
			.filter((d) => d.historical !== null)
			.map((d) => [d.date.getTime(), d.historical] as [number, number]);

		const contributionsData = chartData.map(
			(d) => [d.date.getTime(), d.contributions] as [number, number]
		);

		const pessimisticData = chartData
			.filter((d) => d.pessimistic !== null)
			.map((d) => [d.date.getTime(), d.pessimistic] as [number, number]);

		const realisticData = chartData
			.filter((d) => d.realistic !== null)
			.map((d) => [d.date.getTime(), d.realistic] as [number, number]);

		const optimisticData = chartData
			.filter((d) => d.optimistic !== null)
			.map((d) => [d.date.getTime(), d.optimistic] as [number, number]);

		const labels = {
			historical: m.etf_historical_value(),
			contributions: m.etf_contributions(),
			pessimistic: m.etf_pessimistic(),
			realistic: m.etf_realistic(),
			optimistic: m.etf_optimistic()
		};

		// Reference lines with labels
		const refLineStyle = { type: 'dashed', color: tc.axisLabel, width: 1.5, opacity: 0.4 };
		const refLabelStyle = {
			show: true,
			fontSize: 11,
			color: tc.axisLabel,
			borderWidth: 0,
			backgroundColor: 'transparent',
		};
		const markLineData: any[] = [
			{ xAxis: today.getTime(), label: { ...refLabelStyle, formatter: 'Heute', position: 'insideEndBottom' } }
		];
		if (_retirementDateObj) {
			markLineData.push({
				xAxis: _retirementDateObj.getTime(),
				label: { ...refLabelStyle, formatter: 'Rente', position: 'insideEndTop' }
			});
		}

		// x-axis min: always include today so the "Heute" line is visible
		const firstTs = chartData.length > 0 ? chartData[0].date.getTime() : today.getTime();
		const xMin = Math.min(today.getTime(), firstTs);

		// hsl(H, S, L) → hsla(H, S, L, alpha)
		const withAlpha = (hsl: string, alpha: number) =>
			hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);

		// areaOpacity > 0 adds a gradient fill from that opacity down to 0
		const makeSeries = (
			name: string,
			data: [number, number][],
			color: string,
			dashed = false,
			areaOpacity = 0,
			extra: Record<string, any> = {}
		) => ({
			name,
			type: 'line',
			data,
			itemStyle: { color, borderWidth: 0 },
			lineStyle: { width: 2, color, ...(dashed ? { type: 'dashed' } : {}) },
			...(areaOpacity > 0
				? {
						areaStyle: {
							color: new graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: withAlpha(color, areaOpacity) },
								{ offset: 1, color: withAlpha(color, 0) }
							])
						}
					}
				: {}),
			showSymbol: false,
			smooth: true,
			...extra
		});

		const projectionSeries = _hasProjection
			? [
					makeSeries(labels.pessimistic, pessimisticData, chartColors.pessimistic, true, 0.08),
					makeSeries(labels.realistic, realisticData, chartColors.realistic, true, 0.08),
					makeSeries(labels.optimistic, optimisticData, chartColors.optimistic, true, 0.08)
				]
			: [];

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
				min: xMin,
				minInterval: 60 * 24 * 3600 * 1000,
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
				makeSeries(labels.historical, historicalData, chartColors.historical, false, 0.35, {
					markLine: {
						silent: true,
						symbol: 'none',
						lineStyle: refLineStyle,
						data: markLineData
					}
				}),
				makeSeries(labels.contributions, contributionsData, chartColors.contributions, false, 0.2),
				...projectionSeries
			]
		};
	});
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-3">
			{#each legendItems as item}
				<div class="flex items-center gap-1.5">
					<div class="h-3 w-3 rounded-full" style="background-color: {item.color}"></div>
					<span class="text-xs text-muted-foreground">{item.label}</span>
				</div>
			{/each}
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
	{:else if chartData.length === 0}
		<div
			class="flex items-center justify-center text-sm text-muted-foreground"
			style="height: {height}px"
		>
			{contributionSteps.length === 0 ? m.etf_projection_no_steps() : m.etf_historical_no_data()}
		</div>
	{:else}
		<div style="height: {height}px">
			<Chart {init} options={echartsOptions as any} />
		</div>
	{/if}
</div>
