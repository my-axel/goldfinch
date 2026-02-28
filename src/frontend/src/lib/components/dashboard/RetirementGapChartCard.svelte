<!--
@file src/lib/components/dashboard/RetirementGapChartCard.svelte
@kind component
@purpose Dashboard retirement gap card variant using ECharts for the scenario scale.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { compassApi } from '$lib/api/compass';
	import { scenarioColors } from '$lib/utils/scenario-colors';
	import { formatCurrency } from '$lib/utils/format';
	import {
		aggregateGapAnalyses,
		gapStatusFor,
		normalizeGapAnalysis,
		toGapDisplayValue
	} from '$lib/utils/retirement-gap';
	import { Chart } from 'svelte-echarts';
	import { init } from 'echarts';

	type GapCardSummary = {
		pessimistic: number;
		realistic: number;
		optimistic: number;
		totalRequired: number;
	};

	type ChartScale = {
		maxAbs: number;
		axisPessimistic: number;
		axisRealistic: number;
		axisOptimistic: number;
		rangeMin: number;
		rangeMax: number;
		realisticLabelPct: number;
	};

	let summary = $state<GapCardSummary | null>(null);
	let loading = $state(false);
	let requestSeq = 0;

	async function loadSummary(memberId: number | undefined) {
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
				summary =
					aggregate.count > 0
						? {
								pessimistic: aggregate.totals.pessimistic,
								realistic: aggregate.totals.realistic,
								optimistic: aggregate.totals.optimistic,
								totalRequired: aggregate.totalRequired
							}
						: null;
				return;
			}

			try {
				const analysis = await compassApi.getAnalysis(memberId);
				const normalized = normalizeGapAnalysis(analysis);
				if (reqId !== requestSeq) return;
				summary = normalized
					? {
							pessimistic: normalized.pessimistic,
							realistic: normalized.realistic,
							optimistic: normalized.optimistic,
							totalRequired: normalized.requiredCapitalAdjusted
						}
					: null;
			} catch {
				if (reqId !== requestSeq) return;
				summary = null;
			}
		} finally {
			if (reqId === requestSeq) loading = false;
		}
	}

	$effect(() => {
		loadSummary(dashboardStore.selectedMemberId);
	});

	const isDark = $derived.by(() => {
		const t = themeStore.current;
		if (!browser) return false;
		if (t === 'light') return false;
		if (t === 'dark') return true;
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	});

	const chartTheme = $derived.by(() => {
		const dark = isDark;
		return dark
			? {
					line: 'hsl(0, 0%, 45%)',
					tick: 'hsl(0, 0%, 70%)',
					rangeFill: 'hsla(0, 0%, 70%, 0.2)',
					rangeStroke: 'hsl(0, 0%, 35%)',
					tooltipBg: 'hsl(0, 0%, 11%)',
					tooltipBorder: 'hsl(0, 0%, 15%)',
					tooltipText: 'hsl(210, 20%, 98%)'
				}
			: {
					line: 'hsl(0, 0%, 56%)',
					tick: 'hsl(0, 0%, 30%)',
					rangeFill: 'hsla(0, 0%, 52%, 0.18)',
					rangeStroke: 'hsl(0, 0%, 78%)',
					tooltipBg: 'hsl(0, 0%, 100%)',
					tooltipBorder: 'hsl(0, 0%, 89%)',
					tooltipText: 'hsl(0, 0%, 9%)'
				};
	});

	const gapColorClass = $derived.by(() => {
		if (!summary) return '';
		const status = gapStatusFor(summary.realistic, summary.totalRequired);
		if (status === 'on_track') return 'text-green-600 dark:text-green-400';
		if (status === 'needs_attention') return 'text-yellow-600 dark:text-yellow-400';
		return 'text-red-600 dark:text-red-400';
	});

	const realisticDisplay = $derived(summary ? toGapDisplayValue(summary.realistic) : null);

	const scale = $derived.by((): ChartScale | null => {
		if (!summary) return null;

		// Convert to axis semantics: left=shortfall, right=surplus.
		const axisPessimistic = -summary.pessimistic;
		const axisRealistic = -summary.realistic;
		const axisOptimistic = -summary.optimistic;

		const maxAbs = Math.max(
			Math.abs(axisPessimistic),
			Math.abs(axisRealistic),
			Math.abs(axisOptimistic),
			1
		);

		const toPercent = (value: number, padding = 12): number => {
			const raw = ((value + maxAbs) / (maxAbs * 2)) * 100;
			return Math.min(100 - padding, Math.max(padding, raw));
		};

		return {
			maxAbs,
			axisPessimistic,
			axisRealistic,
			axisOptimistic,
			rangeMin: Math.min(axisPessimistic, axisOptimistic),
			rangeMax: Math.max(axisPessimistic, axisOptimistic),
			realisticLabelPct: toPercent(axisRealistic, 18)
		};
	});

	function gapTooltipData(label: string, gapValue: number) {
		const display = toGapDisplayValue(gapValue);
		if (!display) {
			return {
				label,
				signedAmount: label,
				meaning: ''
			};
		}
		const formatted = formatCurrency(
			display.absolute,
			settingsStore.current.number_locale,
			settingsStore.current.currency,
			0
		);
		const signed = display.isSurplus ? `+${formatted}` : formatted;
		const meaning = display.isSurplus
			? m.dashboard_retirement_gap_surplus()
			: m.dashboard_retirement_gap_shortfall();
		return {
			label,
			signedAmount: signed,
			meaning,
			isSurplus: display.isSurplus
		};
	}

	const chartOptions = $derived.by(() => {
		if (!summary || !scale) return {};

		// Align chart geometry with the HTML baseline bar at top 16px (center ~20px in a 54px chart box).
		const y = 0.68;
		const theme = chartTheme;
		const pointData = [
			{
				name: m.settings_pessimistic(),
				value: [scale.axisPessimistic, y],
				rawGap: summary.pessimistic,
				color: scenarioColors.pessimistic,
				size: 14
			},
			{
				name: m.settings_realistic(),
				value: [scale.axisRealistic, y],
				rawGap: summary.realistic,
				color: scenarioColors.realistic,
				size: 18
			},
			{
				name: m.settings_optimistic(),
				value: [scale.axisOptimistic, y],
				rawGap: summary.optimistic,
				color: scenarioColors.optimistic,
				size: 14
			}
		];

		return {
			animationDuration: 300,
			grid: { left: 6, right: 6, top: 8, bottom: 8 },
			xAxis: {
				type: 'value' as const,
				min: -scale.maxAbs,
				max: scale.maxAbs,
				show: false
			},
			yAxis: {
				type: 'value' as const,
				min: 0,
				max: 1,
				show: false
			},
				tooltip: {
					trigger: 'item' as const,
					backgroundColor: theme.tooltipBg,
					borderColor: theme.tooltipBorder,
					borderWidth: 1,
					textStyle: { color: theme.tooltipText },
					padding: [10, 12],
					formatter: (params: any) => {
						const data = params?.data;
						if (!data) return '';
						const model = gapTooltipData(data.name, Number(data.rawGap));
						const valueColor = model.isSurplus ? 'hsl(142 71% 45%)' : 'hsl(0 72% 51%)';
						return `
							<div style="min-width: 170px">
								<div style="display:flex;align-items:center;gap:8px;font-size:12px;line-height:1.2;">
									<span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${data.color};"></span>
									<span style="font-weight:600;">${model.label}</span>
								</div>
								<div style="margin-top:8px;font-size:24px;line-height:1.05;font-weight:700;color:${valueColor};">
									${model.signedAmount}
								</div>
								<div style="margin-top:4px;font-size:12px;opacity:0.9;">
									${model.meaning}
								</div>
							</div>
						`;
					}
				},
			series: [
				{
					type: 'custom',
					silent: true,
					z: 2,
					data: [0],
					renderItem: (params: any, api: any) => {
						const x = api.coord([0, y])[0];
						const yTop = api.coord([0, y + 0.14])[1];
						const yBottom = api.coord([0, y - 0.14])[1];
						return {
							type: 'line',
							shape: {
								x1: x,
								y1: yTop,
								x2: x,
								y2: yBottom
							},
							style: {
								stroke: theme.tick,
								lineWidth: 1.5
							}
						};
					}
				},
				{
					type: 'custom',
					silent: true,
					z: 1,
					data: [[scale.rangeMin, scale.rangeMax]],
					renderItem: (params: any, api: any) => {
						const yTop = api.coord([0, y + 0.045])[1];
						const yBottom = api.coord([0, y - 0.045])[1];
						const xStart = api.coord([api.value(0), y])[0];
						const xEnd = api.coord([api.value(1), y])[0];
						return {
							type: 'rect',
							shape: {
								x: Math.min(xStart, xEnd),
								y: Math.min(yTop, yBottom),
								width: Math.max(2, Math.abs(xEnd - xStart)),
								height: Math.abs(yBottom - yTop),
								r: 4
							},
							style: {
								fill: theme.rangeFill,
								stroke: theme.rangeStroke,
								lineWidth: 4
							}
						};
					}
				},
				{
					type: 'scatter',
					z: 3,
					data: pointData,
					symbolSize: (value: any, params: any) => params?.data?.size ?? 9,
					itemStyle: {
						color: (params: any) => params?.data?.color,
						borderColor: isDark ? 'hsl(0, 0%, 11%)' : 'hsl(0, 0%, 100%)',
						borderWidth: 2
					},
					emphasis: {
						scale: 1.1
					}
				}
			]
		};
	});
</script>

<div class="bg-card rounded-xl border border-border shadow-sm p-5">
	{#if loading}
		<div class="flex items-center justify-center h-24 text-muted-foreground text-sm">…</div>
	{:else if summary && realisticDisplay && scale}
		<div class="space-y-2">
			<h3 class="text-lg font-semibold">{m.dashboard_retirement_gap_title()}</h3>

			<div>
				<p class="text-center text-[10px] font-medium text-muted-foreground">
					{m.compass_gap_required_capital_adjusted()}
				</p>
				<p class="text-center text-2xl font-bold leading-none text-foreground">
					<FormattedCurrency value={summary.totalRequired} decimals={0} />
				</p>
			</div>

			<div class="relative -mt-1 h-[92px]">
				<div class="absolute left-0 right-0 top-[16px] h-2 rounded-l-full bg-red-500/12"></div>
				<div class="absolute left-1/2 right-0 top-[16px] h-2 rounded-r-full bg-green-500/12"></div>
				<div class="absolute left-0 right-0 top-0 h-[54px]">
					<Chart {init} options={chartOptions as any} />
				</div>

				<div
					class="absolute top-[34px] -translate-x-1/2 text-center"
					style="left: {scale.realisticLabelPct}%"
				>
					<p class="text-xs text-muted-foreground">{m.settings_realistic()}</p>
					<p class="text-xl font-semibold {gapColorClass}">
						{#if realisticDisplay.isSurplus}
							+<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />
						{:else}
							<FormattedCurrency value={realisticDisplay.absolute} decimals={0} />
						{/if}
					</p>
					<p class="text-sm text-muted-foreground">
						{realisticDisplay.isSurplus
							? m.dashboard_retirement_gap_surplus()
							: m.dashboard_retirement_gap_shortfall()}
					</p>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
				<span class="inline-flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full" style="background-color: {scenarioColors.pessimistic};"></span>
					{m.settings_pessimistic()}
				</span>
				<span class="inline-flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full" style="background-color: {scenarioColors.realistic};"></span>
					{m.settings_realistic()}
				</span>
				<span class="inline-flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full" style="background-color: {scenarioColors.optimistic};"></span>
					{m.settings_optimistic()}
				</span>
			</div>

			<p class="text-[11px] text-muted-foreground">{m.dashboard_retirement_gap_horizon()}</p>

			<a href="/compass" class="text-sm text-primary hover:underline">{m.dashboard_retirement_gap_view_details()}</a>
		</div>
	{:else}
		<div class="space-y-3">
			<h3 class="text-lg font-semibold">{m.dashboard_retirement_gap_title()}</h3>
			<p class="text-sm text-muted-foreground">{m.dashboard_retirement_gap_description()}</p>
			<a href="/compass" class="inline-block text-sm font-medium text-primary hover:underline">
				{m.dashboard_retirement_gap_setup_cta()}
			</a>
		</div>
	{/if}
</div>
