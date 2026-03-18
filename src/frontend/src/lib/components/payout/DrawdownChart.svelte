<!--
@file src/lib/components/payout/DrawdownChart.svelte
@kind component
@purpose ECharts-Liniendiagramm: Kapitalverzehr über die Rentenjahre in 3 Szenarien.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { formatCurrency } from '$lib/utils/format';
	import { scenarioColors } from '$lib/utils/scenario-colors';
	import { Chart } from 'svelte-echarts';
	import { init } from 'echarts';

	export interface DrawdownPoint {
		year: number;
		pessimistic: number;
		realistic: number;
		optimistic: number;
	}

	let {
		drawdownPoints,
		withdrawalYears
	}: {
		drawdownPoints: DrawdownPoint[];
		withdrawalYears: number;
	} = $props();

	// ── Theme & formatting ───────────────────────────────────────────────────────

	const locale = $derived(settingsStore.current.number_locale);
	const currency = $derived(settingsStore.current.currency);

	const currencyFmt = $derived.by(() => {
		const _l = locale;
		const _c = currency;
		return (v: number) => formatCurrency(v, _l, _c, 0);
	});

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

	// ── Chart options ────────────────────────────────────────────────────────────

	const echartsOptions = $derived.by(() => {
		const points = drawdownPoints;
		const tc = themeColors;
		const _fmt = currencyFmt;

		if (!points || points.length === 0) return null;

		const years = points.map((p) => String(p.year));
		const pessimisticData = points.map((p) => p.pessimistic);
		const realisticData = points.map((p) => p.realistic);
		const optimisticData = points.map((p) => p.optimistic);

		// Find first index where capital hits 0 per scenario
		const depletionIdx = (data: number[]): number | null => {
			const idx = data.findIndex((v) => v <= 0);
			return idx > 0 ? idx : null; // idx 0 means no capital at all, ignore
		};

		const pessDepIdx = depletionIdx(pessimisticData);
		const realDepIdx = depletionIdx(realisticData);
		const optDepIdx = depletionIdx(optimisticData);

		const makeMarkLine = (idx: number | null, color: string) => {
			if (idx === null) return undefined;
			return {
				silent: true,
				symbol: ['none', 'none'],
				data: [{ xAxis: idx }],
				lineStyle: { color, type: 'dashed', opacity: 0.5, width: 1.5 }
			};
		};

		const makeSeries = (
			name: string,
			data: number[],
			color: string,
			areaOpacity: number,
			depIdx: number | null
		) => ({
			name,
			type: 'line',
			data,
			smooth: true,
			showSymbol: false,
			itemStyle: { color, borderWidth: 0 },
			lineStyle: { width: 2, color },
			areaStyle: { color, opacity: areaOpacity },
			...(depIdx !== null ? { markLine: makeMarkLine(depIdx, color) } : {})
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
					const year = params[0].axisValue;
					let html = `<div style="font-weight:600;margin-bottom:6px">${m.payout_years_suffix()} ${year}</div>`;
					for (const p of params) {
						if (p.value == null) continue;
						const depleted = p.value <= 0;
						html += `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:3px">
							<span style="display:flex;align-items:center;gap:6px">
								<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
								${p.seriesName}
							</span>
							<span style="font-weight:500;color:${depleted ? '#ef4444' : 'inherit'}">
								${depleted ? m.payout_depletion_label() : _fmt(p.value)}
							</span>
						</div>`;
					}
					return html;
				}
			},
			grid: { top: 12, right: 12, bottom: 40, left: 90 },
			xAxis: {
				type: 'category',
				data: years,
				name: m.payout_years_suffix(),
				nameLocation: 'end',
				nameTextStyle: { color: tc.axisLabel, fontSize: 11 },
				axisLabel: {
					hideOverlap: true,
					color: tc.axisLabel,
					interval: Math.max(0, Math.floor(years.length / 8) - 1)
				},
				axisLine: { lineStyle: { color: tc.axisLine } },
				splitLine: { show: false }
			},
			yAxis: {
				type: 'value',
				axisLabel: {
					formatter: (val: number) => _fmt(val),
					color: tc.axisLabel
				},
				axisLine: { show: false },
				splitLine: { lineStyle: { color: tc.splitLine } },
				min: 0
			},
			series: [
				// Render optimistic first (behind) so areas layer nicely
				makeSeries(
					m.settings_optimistic(),
					optimisticData,
					scenarioColors.optimistic,
					0.12,
					optDepIdx
				),
				makeSeries(
					m.settings_realistic(),
					realisticData,
					scenarioColors.realistic,
					0.10,
					realDepIdx
				),
				makeSeries(
					m.settings_pessimistic(),
					pessimisticData,
					scenarioColors.pessimistic,
					0.08,
					pessDepIdx
				)
			]
		};
	});

	// ── Legend ───────────────────────────────────────────────────────────────────

	const legendItems = $derived([
		{ color: scenarioColors.optimistic, label: m.settings_optimistic() },
		{ color: scenarioColors.realistic, label: m.settings_realistic() },
		{ color: scenarioColors.pessimistic, label: m.settings_pessimistic() }
	]);
</script>

<div class="space-y-2">
	<!-- Legend -->
	<div class="flex flex-wrap items-center gap-3">
		{#each legendItems as item (item.label)}
			<div class="flex items-center gap-1.5">
				<div class="h-0.5 w-6 rounded-full" style="background-color: {item.color}"></div>
				<span class="text-xs text-muted-foreground">{item.label}</span>
			</div>
		{/each}
	</div>

	<!-- ECharts -->
	{#if echartsOptions && drawdownPoints.length > 0}
		<div style="height: 280px">
			<Chart {init} options={echartsOptions as any} />
		</div>
	{:else}
		<div
			class="flex items-center justify-center text-sm text-muted-foreground rounded-lg bg-muted/30"
			style="height: 280px"
		>
			—
		</div>
	{/if}
</div>
