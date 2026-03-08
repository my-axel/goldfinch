<!--
@file src/lib/components/compass/GapTimelineChart.svelte
@kind component
@purpose Visualisiert die Rentenlücke im Zeitverlauf — benötigte Rente vs. projizierte Renteneinkommen (3 Szenarien) von heute bis zum Renteneintrittsdatum. Unterstützt Einzelmitglieder- und Haushalt-Gesamtansicht.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { formatCurrency } from '$lib/utils/format';
	import { scenarioColors } from '$lib/utils/scenario-colors';
	import type { GapTimeline, GapAnalysisResult, GapScenarios } from '$lib/types/compass';
	import type { HouseholdMember } from '$lib/types/household';
	import { Chart } from 'svelte-echarts';
	import { init } from 'echarts';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';

	let {
		timelines,
		analyses,
		members,
		householdOnly = false,
		showSidePanel = true
	}: {
		timelines: (GapTimeline | null)[];
		analyses: (GapAnalysisResult | null)[];
		members: HouseholdMember[];
		householdOnly?: boolean;
		showSidePanel?: boolean;
	} = $props();

	// Filter to members with timelines
	const configuredIndices = $derived(
		timelines
			.map((t, i) => (t !== null ? i : -1))
			.filter((i) => i >= 0)
	);

	// -1 = household aggregate (default), otherwise index into members/timelines/analyses
	let selectedIndex = $state(-1);

	// Active timeline and analysis for the selected view
	const activeTimeline = $derived.by((): GapTimeline | null => {
		if (selectedIndex === -1) return aggregateTimelines();
		return timelines[selectedIndex] ?? null;
	});

	const activeAnalysis = $derived.by((): GapAnalysisResult | null => {
		if (selectedIndex === -1) return aggregateAnalyses();
		return analyses[selectedIndex] ?? null;
	});

	// ── Household aggregation ───────────────────────────────────────────────────

	// Backend Decimal fields serialize as strings in JSON — always coerce to number.
	const n = (v: unknown): number => Number(v) || 0;

	function aggregateTimelines(): GapTimeline | null {
		const valid = timelines.filter((t): t is GapTimeline => t !== null);
		if (valid.length === 0) return null;
		if (valid.length === 1) return valid[0];

		const startYear = Math.min(...valid.map((t) => t.start_year));
		const retirementYear = Math.max(...valid.map((t) => t.retirement_year));
		const numYears = retirementYear - startYear + 1;

		const points = [];
		for (let i = 0; i < numYears; i++) {
			const year = startYear + i;
			let requiredMonthly = 0;
			let pensionPess = 0, pensionReal = 0, pensionOpt = 0;
			let statePess = 0, stateReal = 0, stateOpt = 0;
			let fixedIncome = 0;
			let capPess = 0, capReal = 0, capOpt = 0;

			for (const tl of valid) {
				// Find the data point for this year in the member's timeline
				const yearIdx = year - tl.start_year;
				const pt = yearIdx >= 0 && yearIdx < tl.points.length
					? tl.points[yearIdx]
					: tl.points[tl.points.length - 1]; // use last point if past retirement

				if (!pt) continue;

				// Only add required pension up to and including retirement year
				if (year <= tl.retirement_year) {
					requiredMonthly += n(pt.required_monthly);
				} else {
					// Past retirement: use last required value
					const lastPt = tl.points[tl.points.length - 1];
					requiredMonthly += lastPt ? n(lastPt.required_monthly) : 0;
				}

				pensionPess += n(pt.pension_income.pessimistic);
				pensionReal += n(pt.pension_income.realistic);
				pensionOpt += n(pt.pension_income.optimistic);
				statePess += n(pt.state_income.pessimistic);
				stateReal += n(pt.state_income.realistic);
				stateOpt += n(pt.state_income.optimistic);
				fixedIncome += n(pt.fixed_income);
				capPess += n(pt.capital_income.pessimistic);
				capReal += n(pt.capital_income.realistic);
				capOpt += n(pt.capital_income.optimistic);
			}

			points.push({
				year,
				years_from_now: year - startYear,
				required_monthly: requiredMonthly,
				pension_income: { pessimistic: pensionPess, realistic: pensionReal, optimistic: pensionOpt },
				state_income: { pessimistic: statePess, realistic: stateReal, optimistic: stateOpt },
				fixed_income: fixedIncome,
				capital_income: { pessimistic: capPess, realistic: capReal, optimistic: capOpt }
			});
		}

		const last = points[points.length - 1];
		return {
			member_id: -1,
			start_year: startYear,
			retirement_year: retirementYear,
			points,
			gap_at_retirement: last
				? {
						pessimistic: n(last.required_monthly) - n(last.pension_income.pessimistic),
						realistic: n(last.required_monthly) - n(last.pension_income.realistic),
						optimistic: n(last.required_monthly) - n(last.pension_income.optimistic)
					}
				: { pessimistic: 0, realistic: 0, optimistic: 0 }
		};
	}

	function aggregateAnalyses(): GapAnalysisResult | null {
		const valid = analyses.filter((a): a is GapAnalysisResult => a !== null);
		if (valid.length === 0) return null;
		if (valid.length === 1) return valid[0];

		return {
			...valid[0],
			member_id: -1,
			remaining_monthly_gap: {
				pessimistic: valid.reduce((s, a) => s + n(a.remaining_monthly_gap.pessimistic), 0),
				realistic: valid.reduce((s, a) => s + n(a.remaining_monthly_gap.realistic), 0),
				optimistic: valid.reduce((s, a) => s + n(a.remaining_monthly_gap.optimistic), 0)
			}
		} as GapAnalysisResult;
	}

	// ── Chart configuration ─────────────────────────────────────────────────────

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

	const requiredColor = 'hsl(220, 60%, 55%)';

	const echartsOptions = $derived.by(() => {
		const tl = activeTimeline;
		const tc = themeColors;
		const _fmt = currencyFmt;

		if (!tl || tl.points.length === 0) return null;

		const years = tl.points.map((p) => p.year.toString());
		const requiredData = tl.points.map((p) => p.required_monthly);
		const pessimisticData = tl.points.map((p) => p.pension_income.pessimistic);
		const realisticData = tl.points.map((p) => p.pension_income.realistic);
		const optimisticData = tl.points.map((p) => p.pension_income.optimistic);

		const makeSeries = (
			name: string,
			data: number[],
			color: string,
			dashed = false,
			areaOpacity = 0
		) => ({
			name,
			type: 'line',
			data,
			itemStyle: { color, borderWidth: 0 },
			lineStyle: { width: dashed ? 1.5 : 2, color, ...(dashed ? { type: 'dashed' } : {}) },
			showSymbol: false,
			smooth: true,
			...(areaOpacity > 0
				? {
						areaStyle: {
							color,
							opacity: areaOpacity
						}
					}
				: {})
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
					let html = `<div style="font-weight:600;margin-bottom:6px">${year}</div>`;
					for (const p of params) {
						if (p.value == null) continue;
						html += `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:3px">
							<span style="display:flex;align-items:center;gap:6px">
								<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
								${p.seriesName}
							</span>
							<span style="font-weight:500">${_fmt(p.value)}</span>
						</div>`;
					}
					return html;
				}
			},
			grid: { top: 12, right: 12, bottom: 40, left: 82 },
			xAxis: {
				type: 'category',
				data: years,
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
				splitLine: { lineStyle: { color: tc.splitLine } }
			},
			series: [
				makeSeries(m.compass_timeline_required(), requiredData, requiredColor, false, 0.08),
				makeSeries(m.compass_timeline_pessimistic(), pessimisticData, scenarioColors.pessimistic, true),
				makeSeries(m.compass_timeline_realistic(), realisticData, scenarioColors.realistic, true, 0.12),
				makeSeries(m.compass_timeline_optimistic(), optimisticData, scenarioColors.optimistic, true)
			]
		};
	});

	// ── Legend items ────────────────────────────────────────────────────────────

	const legendItems = $derived([
		{ color: requiredColor, label: m.compass_timeline_required() },
		{ color: scenarioColors.pessimistic, label: m.compass_timeline_pessimistic(), dashed: true },
		{ color: scenarioColors.realistic, label: m.compass_timeline_realistic(), dashed: true },
		{ color: scenarioColors.optimistic, label: m.compass_timeline_optimistic(), dashed: true }
	]);

	// ── Gap panel helpers ────────────────────────────────────────────────────────

	function gapClass(value: number): string {
		return value <= 0
			? 'text-green-600 dark:text-green-400'
			: 'text-red-600 dark:text-red-400';
	}

	function bgClass(value: number): string {
		return value <= 0
			? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
			: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
	}

	const hasMultipleMembers = $derived(!householdOnly && configuredIndices.length > 1);
</script>

<div class="space-y-4">
	<!-- Member selector tabs -->
	{#if hasMultipleMembers}
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				onclick={() => (selectedIndex = -1)}
				class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
					{selectedIndex === -1
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
			>
				{m.compass_timeline_member_household()}
			</button>
			{#each configuredIndices as idx (idx)}
				<button
					type="button"
					onclick={() => (selectedIndex = idx)}
					class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
						{selectedIndex === idx
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
				>
					{members[idx]?.first_name ?? ''}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Main chart + gap panel -->
	<div class="flex gap-4 items-stretch">
		<!-- Chart area -->
		<div class="flex-1 min-w-0 space-y-2">
			<!-- Legend -->
			<div class="flex flex-wrap items-center gap-3">
				{#each legendItems as item (item.label)}
					<div class="flex items-center gap-1.5">
						<div
							class="h-0.5 w-6 rounded-full"
							style="background-color: {item.color}; {item.dashed
								? 'background-image: repeating-linear-gradient(to right, ' +
									item.color +
									' 0, ' +
									item.color +
									' 4px, transparent 4px, transparent 8px); background-color: transparent;'
								: ''}"
						></div>
						<span class="text-xs text-muted-foreground">{item.label}</span>
					</div>
				{/each}
			</div>

			<!-- ECharts -->
			{#if echartsOptions && activeTimeline && activeTimeline.points.length > 0}
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

		<!-- Right panel: gap/surplus per scenario at retirement -->
		{#if showSidePanel}
			<div class="flex flex-col gap-2 w-40 shrink-0 justify-center">
				{#if activeTimeline}
					{@const gap = activeTimeline.gap_at_retirement}
					<!-- Optimistic (top) -->
					<div class="rounded-lg border px-3 py-2 {bgClass(gap.optimistic)}">
						<div class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
							{m.compass_timeline_optimistic()}
						</div>
						<div class="text-sm font-semibold {gapClass(gap.optimistic)}">
							<FormattedCurrency value={Math.abs(gap.optimistic)} decimals={0} />
						</div>
						<div class="text-[10px] text-muted-foreground">
							{gap.optimistic <= 0 ? m.compass_timeline_surplus_label() : m.compass_timeline_gap_label()}
							{m.compass_timeline_at_retirement()}
						</div>
					</div>

					<!-- Realistic (middle) -->
					<div class="rounded-lg border px-3 py-2 {bgClass(gap.realistic)}">
						<div class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
							{m.compass_timeline_realistic()}
						</div>
						<div class="text-sm font-semibold {gapClass(gap.realistic)}">
							<FormattedCurrency value={Math.abs(gap.realistic)} decimals={0} />
						</div>
						<div class="text-[10px] text-muted-foreground">
							{gap.realistic <= 0 ? m.compass_timeline_surplus_label() : m.compass_timeline_gap_label()}
							{m.compass_timeline_at_retirement()}
						</div>
					</div>

					<!-- Pessimistic (bottom) -->
					<div class="rounded-lg border px-3 py-2 {bgClass(gap.pessimistic)}">
						<div class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
							{m.compass_timeline_pessimistic()}
						</div>
						<div class="text-sm font-semibold {gapClass(gap.pessimistic)}">
							<FormattedCurrency value={Math.abs(gap.pessimistic)} decimals={0} />
						</div>
						<div class="text-[10px] text-muted-foreground">
							{gap.pessimistic <= 0
								? m.compass_timeline_surplus_label()
								: m.compass_timeline_gap_label()}
							{m.compass_timeline_at_retirement()}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
