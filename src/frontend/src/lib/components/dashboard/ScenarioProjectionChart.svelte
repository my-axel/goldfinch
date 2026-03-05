<!--
@file src/lib/components/dashboard/ScenarioProjectionChart.svelte
@kind component
@purpose Zeigt die Projektion der beeinflussbaren Altersvorsorge (ETF + Savings) in drei Szenarien.
  Nur Pensionspläne, die der Nutzer direkt steuern kann. Zeigt eine horizontale Ziel-Linie
  (required_capital_adjusted) aus der Kompass-Analyse.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import { scenarioColors } from '$lib/utils/scenario-colors';
	import { formatCurrency } from '$lib/utils/format';
	import { compassApi } from '$lib/api/compass';
	import type { HouseholdMember } from '$lib/types/household';
	import type { SeriesProjectionDataPoint } from '$lib/types/pension';
	import { Chart } from 'svelte-echarts';
	import { init, graphic } from 'echarts';
	import { Expand, Shrink } from '@lucide/svelte';

	let {
		loading = false,
		members = []
	}: {
		loading?: boolean;
		members?: HouseholdMember[];
	} = $props();

	// ── Compass data: configured member IDs + goal capital ───────────────────

	let configuredMemberIds = $state<Set<number>>(new Set());
	let goalCapital = $state<number | null>(null);
	let loadSeq = 0;

	$effect(() => {
		const memberId = dashboardStore.selectedMemberId;
		const seq = ++loadSeq;

		compassApi.getAllConfigs().then(async (configs) => {
			if (seq !== loadSeq) return;
			configuredMemberIds = new Set(configs.map((c) => c.member_id));

			if (configs.length === 0) { goalCapital = null; return; }

			try {
				if (memberId !== undefined) {
					const config = configs.find((c) => c.member_id === memberId);
					if (!config) { goalCapital = null; return; }
					const analysis = await compassApi.getAnalysis(memberId);
					if (seq !== loadSeq) return;
					goalCapital = Number(analysis.required_capital_adjusted.realistic);
				} else {
					const analyses = await Promise.all(
						configs.map((c) => compassApi.getAnalysis(c.member_id).catch(() => null))
					);
					if (seq !== loadSeq) return;
					const total = analyses.reduce((sum, a) => sum + Number(a?.required_capital_adjusted?.realistic ?? 0), 0);
					goalCapital = total > 0 ? total : null;
				}
			} catch {
				if (seq !== loadSeq) return;
				goalCapital = null;
			}
		}).catch(() => {
			configuredMemberIds = new Set();
			goalCapital = null;
		});
	});

	// ── Chart state ──────────────────────────────────────────────────────────

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
					axisLine: 'hsl(0, 0%, 15%)',
					goalLine: 'hsl(0, 72%, 55%)'
				}
			: {
					tooltipBg: 'hsl(0, 0%, 100%)',
					tooltipBorder: 'hsl(0, 0%, 89%)',
					tooltipText: 'hsl(0, 0%, 9%)',
					axisLabel: 'hsl(0, 0%, 45%)',
					splitLine: 'hsl(0, 0%, 89%)',
					axisLine: 'hsl(0, 0%, 89%)',
					goalLine: 'hsl(0, 72%, 51%)'
				};
	});

	// ── Merge ETF + Savings projections ──────────────────────────────────────

	/**
	 * Combines two projection arrays by summing values at each date.
	 * Uses LOCF for dates that exist in one series but not the other.
	 */
	function mergeProjectionArrays(
		a: SeriesProjectionDataPoint[],
		b: SeriesProjectionDataPoint[]
	): SeriesProjectionDataPoint[] {
		if (a.length === 0) return b;
		if (b.length === 0) return a;

		const aMap = new Map(a.map((d) => [d.date, Number(d.value)]));
		const bMap = new Map(b.map((d) => [d.date, Number(d.value)]));
		const allDates = [...new Set([...a.map((d) => d.date), ...b.map((d) => d.date)])].sort();

		let lastA = 0;
		let lastB = 0;
		return allDates.map((date) => {
			if (aMap.has(date)) lastA = aMap.get(date)!;
			if (bMap.has(date)) lastB = bMap.get(date)!;
			return { date, value: lastA + lastB };
		});
	}

	const combinedProjection = $derived.by(() => {
		const byType = dashboardStore.seriesData?.by_type;
		if (!byType) return null;

		const etf = byType['ETF_PLAN'];
		const savings = byType['SAVINGS'];

		if (!etf && !savings) return null;
		const etfProj = etf?.projection;
		const savingsProj = savings?.projection;

		return {
			pessimistic: mergeProjectionArrays(etfProj?.pessimistic ?? [], savingsProj?.pessimistic ?? []),
			realistic: mergeProjectionArrays(etfProj?.realistic ?? [], savingsProj?.realistic ?? []),
			optimistic: mergeProjectionArrays(etfProj?.optimistic ?? [], savingsProj?.optimistic ?? [])
		};
	});

	const hasProjectionData = $derived((combinedProjection?.realistic?.length ?? 0) > 0);

	const withAlpha = (hsl: string, alpha: number) =>
		hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);

	// ── ECharts options ───────────────────────────────────────────────────────

	const echartsOptions = $derived.by(() => {
		const _fmt = currencyFmt;
		const _dateFmt = headerDateFmt;
		const _l = locale;
		const tc = themeColors;
		const proj = combinedProjection;
		const _goalCapital = goalCapital;
		const _configuredIds = configuredMemberIds;

		if (!proj) return {};

		// Retirement markLines — only for members with compass config
		const visibleMembers = (dashboardStore.selectedMemberId === undefined
			? members
			: members.filter((mb) => mb.id === dashboardStore.selectedMemberId)
		).filter((mb) => _configuredIds.has(mb.id));

		const retirementMarkLines = visibleMembers
			.filter((mb) => mb.retirement_date_planned)
			.map((mb) => ({
				xAxis: new Date(mb.retirement_date_planned).getTime(),
				lineStyle: { color: tc.axisLabel, type: 'dotted' as const, width: 1.5, opacity: 0.7 },
				label: {
					show: true,
					position: 'insideEndTop' as const,
					formatter: m.dashboard_scenario_projection_retirement_label({ name: mb.first_name }),
					color: tc.axisLabel,
					fontSize: 11
				}
			}));

		const maxRetirementTs = retirementMarkLines.length > 0
			? Math.max(...retirementMarkLines.map((l) => l.xAxis))
			: null;
		const MS_PER_MONTH = 30.44 * 24 * 60 * 60 * 1000;
		const xAxisMax = maxRetirementTs ? maxRetirementTs + 5 * MS_PER_MONTH : undefined;

		const pessimisticData = proj.pessimistic.map(
			(d) => [new Date(d.date).getTime(), d.value] as [number, number]
		);
		const realisticData = proj.realistic.map(
			(d) => [new Date(d.date).getTime(), d.value] as [number, number]
		);
		const optimisticData = proj.optimistic.map(
			(d) => [new Date(d.date).getTime(), d.value] as [number, number]
		);

		const makeAreaSeries = (
			name: string,
			data: [number, number][],
			color: string,
			lineWidth: number,
			areaOpacity: number,
			extra: Record<string, any> = {}
		) => ({
			name,
			type: 'line' as const,
			data,
			itemStyle: { color, borderWidth: 0 },
			lineStyle: { width: lineWidth, color },
			areaStyle: {
				color: new graphic.LinearGradient(0, 0, 0, 1, [
					{ offset: 0, color: withAlpha(color, areaOpacity) },
					{ offset: 1, color: withAlpha(color, 0) }
				])
			},
			showSymbol: false,
			smooth: true,
			...extra
		});

		// Goal line (horizontal) + retirement vertical lines on realistic series
		const realisticExtra: Record<string, any> = {};
		const markLineData: any[] = [...retirementMarkLines];
		if (_goalCapital !== null) {
			markLineData.push({
				yAxis: _goalCapital,
				lineStyle: { color: tc.goalLine, type: 'dashed', width: 1.5 },
				label: {
					show: true,
					position: 'insideEndTop',
					formatter: `${m.dashboard_scenario_projection_goal()}: ${_fmt(_goalCapital)}`,
					color: tc.goalLine,
					fontSize: 11
				}
			});
		}
		if (markLineData.length > 0) {
			realisticExtra.markLine = { silent: true, symbol: 'none', data: markLineData };
		}

		return {
			backgroundColor: 'transparent',
			animation: true,
			tooltip: {
				trigger: 'axis' as const,
				axisPointer: { type: 'line' as const },
				backgroundColor: tc.tooltipBg,
				borderColor: tc.tooltipBorder,
				textStyle: { color: tc.tooltipText },
				formatter: (params: any[]) => {
					if (!params || params.length === 0) return '';
					const ts = params[0].value[0];
					const dateStr = _dateFmt(new Date(ts));
					let html = `<div style="font-weight:600;margin-bottom:6px">${dateStr}</div>`;
					for (const p of params) {
						if (p.value[1] == null) continue;
						html += `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:3px">
							<span style="display:flex;align-items:center;gap:6px">
								<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
								${p.seriesName}
							</span>
							<span style="font-weight:500">${_fmt(p.value[1])}</span>
						</div>`;
					}
					return html;
				}
			},
			grid: { top: 12, right: 12, bottom: 58, left: 80 },
			xAxis: {
				type: 'time' as const,
				minInterval: 60 * 24 * 3600 * 1000,
				...(xAxisMax !== undefined ? { max: xAxisMax } : {}),
				axisLabel: {
					hideOverlap: true,
					rotate: -45,
					color: tc.axisLabel,
					formatter: (val: number) => {
						const d = new Date(val);
						if (d.getMonth() === 0) return d.getFullYear().toString();
						return d.toLocaleDateString(_l, { month: 'short' });
					}
				},
				axisLine: { lineStyle: { color: tc.axisLine } },
				splitLine: { show: false }
			},
			yAxis: {
				type: 'value' as const,
				axisLabel: { formatter: (val: number) => _fmt(val), color: tc.axisLabel },
				axisLine: { show: false },
				splitLine: { lineStyle: { color: tc.splitLine } }
			},
			series: [
				makeAreaSeries(m.settings_pessimistic(), pessimisticData, scenarioColors.pessimistic, 1, 0.12),
				makeAreaSeries(m.settings_optimistic(), optimisticData, scenarioColors.optimistic, 1, 0.12),
				makeAreaSeries(m.settings_realistic(), realisticData, scenarioColors.realistic, 2.5, 0.22, realisticExtra)
			]
		};
	});
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full" style="background-color: {scenarioColors.pessimistic}"></div>
				<span class="text-xs text-muted-foreground">{m.settings_pessimistic()}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full" style="background-color: {scenarioColors.realistic}"></div>
				<span class="text-xs text-muted-foreground">{m.settings_realistic()}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full" style="background-color: {scenarioColors.optimistic}"></div>
				<span class="text-xs text-muted-foreground">{m.settings_optimistic()}</span>
			</div>
		</div>
		<button
			type="button"
			onclick={() => (isExpanded = !isExpanded)}
			class="h-8 w-8 shrink-0 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
			title={isExpanded ? 'Collapse' : 'Expand'}
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
	{:else if !hasProjectionData}
		<div
			class="flex items-center justify-center text-sm text-muted-foreground"
			style="height: {height}px"
		>
			{m.dashboard_scenario_projection_no_data()}
		</div>
	{:else}
		<div style="height: {height}px">
			<Chart {init} options={echartsOptions as any} />
		</div>
	{/if}
</div>
