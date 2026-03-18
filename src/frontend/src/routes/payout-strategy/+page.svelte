<!--
@file src/routes/payout-strategy/+page.svelte
@kind route
@purpose Auszahlungsstrategie: Per-Member und Haushalts-Ansicht mit HouseholdSwitcher.
-->

<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationAlert from '$lib/components/ui/ExplanationAlert.svelte';
	import HouseholdSwitcher from '$lib/components/dashboard/HouseholdSwitcher.svelte';
	import CapitalOverview from '$lib/components/payout/CapitalOverview.svelte';
	import IncomeBreakdown from '$lib/components/payout/IncomeBreakdown.svelte';
	import DrawdownChart from '$lib/components/payout/DrawdownChart.svelte';
	import MemberRetirementInfo from '$lib/components/payout/MemberRetirementInfo.svelte';
	import MemberPensionList from '$lib/components/payout/MemberPensionList.svelte';
	import MemberSummaryCards from '$lib/components/payout/MemberSummaryCards.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { GapAnalysisResult } from '$lib/types/compass';

	let { data } = $props();

	// ── State ────────────────────────────────────────────────────────────────────

	let selectedMemberId = $state<number | undefined>(undefined);
	let withdrawalYears = $state(25);

	// ── Data helpers ─────────────────────────────────────────────────────────────

	const n = (v: unknown): number => Number(v) || 0;

	const validAnalyses = $derived(
		data.analyses.filter((a: GapAnalysisResult | null): a is GapAnalysisResult => a !== null)
	);

	// ── Member selection ─────────────────────────────────────────────────────────

	const selectedMember = $derived(
		selectedMemberId !== undefined
			? data.members.find((mem) => mem.id === selectedMemberId) ?? null
			: null
	);

	const selectedAnalysis = $derived.by(() => {
		if (selectedMemberId === undefined) return null;
		const idx = data.members.findIndex((mem) => mem.id === selectedMemberId);
		return idx >= 0 ? data.analyses[idx] : null;
	});

	const memberPensions = $derived(
		selectedMemberId !== undefined
			? data.pensions.filter((p) => p.member_id === selectedMemberId)
			: data.pensions
	);

	// ── Aggregation: sum across all household members ─────────────────────────────

	const aggregated = $derived.by(() => {
		if (validAnalyses.length === 0) return null;

		return {
			projected_capital: {
				pessimistic: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.projected_capital.pessimistic), 0),
				realistic: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.projected_capital.realistic), 0),
				optimistic: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.projected_capital.optimistic), 0)
			},
			remaining_monthly_gap: {
				pessimistic: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.remaining_monthly_gap.pessimistic), 0),
				realistic: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.remaining_monthly_gap.realistic), 0),
				optimistic: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.remaining_monthly_gap.optimistic), 0)
			},
			state_monthly: {
				pessimistic: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.breakdown.state_monthly.pessimistic), 0),
				realistic: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.breakdown.state_monthly.realistic), 0),
				optimistic: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.breakdown.state_monthly.optimistic), 0)
			},
			company_monthly: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.breakdown.company_monthly), 0),
			insurance_monthly: validAnalyses.reduce((s: number, a: GapAnalysisResult) => s + n(a.breakdown.insurance_monthly), 0),
			years_to_retirement: Math.max(...validAnalyses.map((a: GapAnalysisResult) => n(a.years_to_retirement)))
		};
	});

	// ── View data: either aggregated (All) or per-member ─────────────────────────

	const viewData = $derived.by(() => {
		if (selectedMemberId === undefined) return aggregated;

		const a = selectedAnalysis;
		if (!a) return null;
		return {
			projected_capital: a.projected_capital,
			remaining_monthly_gap: a.remaining_monthly_gap,
			state_monthly: a.breakdown.state_monthly,
			company_monthly: n(a.breakdown.company_monthly),
			insurance_monthly: n(a.breakdown.insurance_monthly),
			years_to_retirement: n(a.years_to_retirement)
		};
	});

	const hasData = $derived(viewData !== null);

	// ── Capital income (clamped to >= 0) ─────────────────────────────────────────

	const capitalIncome = $derived.by(() => {
		const vd = viewData;
		if (!vd) return null;
		return {
			pessimistic: Math.max(0, n(vd.remaining_monthly_gap.pessimistic)),
			realistic: Math.max(0, n(vd.remaining_monthly_gap.realistic)),
			optimistic: Math.max(0, n(vd.remaining_monthly_gap.optimistic))
		};
	});

	// ── Drawdown computation ──────────────────────────────────────────────────────

	interface DrawdownPoint {
		year: number;
		pessimistic: number;
		realistic: number;
		optimistic: number;
	}

	const drawdownPoints = $derived.by((): DrawdownPoint[] => {
		const vd = viewData;
		if (!vd) return [];

		const rates = {
			pessimistic: data.settings.projection_pessimistic_rate / 100,
			realistic: data.settings.projection_realistic_rate / 100,
			optimistic: data.settings.projection_optimistic_rate / 100
		};

		const annualWithdrawal = {
			pessimistic: Math.max(0, n(vd.remaining_monthly_gap.pessimistic)) * 12,
			realistic: Math.max(0, n(vd.remaining_monthly_gap.realistic)) * 12,
			optimistic: Math.max(0, n(vd.remaining_monthly_gap.optimistic)) * 12
		};

		let cap = {
			pessimistic: n(vd.projected_capital.pessimistic),
			realistic: n(vd.projected_capital.realistic),
			optimistic: n(vd.projected_capital.optimistic)
		};

		const points: DrawdownPoint[] = [{ year: 0, ...cap }];

		for (let year = 1; year <= withdrawalYears; year++) {
			cap = {
				pessimistic: Math.max(0, cap.pessimistic * (1 + rates.pessimistic) - annualWithdrawal.pessimistic),
				realistic: Math.max(0, cap.realistic * (1 + rates.realistic) - annualWithdrawal.realistic),
				optimistic: Math.max(0, cap.optimistic * (1 + rates.optimistic) - annualWithdrawal.optimistic)
			};
			points.push({ year, ...cap });
		}

		return points;
	});
</script>

<div class="space-y-8">
	<PageHeader title={m.payout_title()} description={m.payout_description()} />

	<!-- HouseholdSwitcher -->
	{#if data.members.length > 1}
		<HouseholdSwitcher members={data.members} bind:selectedMemberId />
	{/if}

	<!-- ═══ CONTENT ═══════════════════════════════════════════════════════════ -->

	{#if selectedMember && !selectedAnalysis}
		<!-- Member selected but no gap analysis configured -->
		<ContentSection>
			<Card title={m.payout_no_data_title()}>
				<p class="text-sm text-muted-foreground">{m.payout_member_no_analysis()}</p>
				<a
					href="/compass"
					class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
				>
					{m.payout_no_data_cta()} →
				</a>
			</Card>
		</ContentSection>

	{:else if !hasData}
		<!-- Empty state: no data at all -->
		<ContentSection>
			<Card title={m.payout_no_data_title()}>
				<p class="text-sm text-muted-foreground">{m.payout_no_data_description()}</p>
				<a
					href="/compass"
					class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
				>
					{m.payout_no_data_cta()} →
				</a>
			</Card>

			{#snippet aside()}
				<Explanation title={m.payout_explanation_capital_title()}>
					<p>{m.payout_explanation_capital_text()}</p>
					<p class="mt-2">{m.payout_explanation_swr_text()}</p>
				</Explanation>
			{/snippet}
		</ContentSection>

	{:else if viewData && capitalIncome}
		<!-- Member info strip (per-member view only) -->
		{#if selectedMember && selectedAnalysis}
			<MemberRetirementInfo member={selectedMember} analysis={selectedAnalysis} />
		{/if}

		<!-- Section A: Capital Overview -->
		<ContentSection>
			<CapitalOverview
				projectedCapital={viewData.projected_capital}
				{capitalIncome}
				yearsToRetirement={viewData.years_to_retirement}
				bind:withdrawalYears
			/>

			{#snippet aside()}
				<Explanation title={m.payout_explanation_capital_title()}>
					<p>{m.payout_explanation_capital_text()}</p>
					<p class="mt-2">{m.payout_explanation_swr_text()}</p>
					<ExplanationAlert>
						{m.payout_explanation_projection_disclaimer()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
		</ContentSection>

		<!-- Section B: Income Breakdown -->
		<ContentSection>
			<IncomeBreakdown
				stateMonthly={viewData.state_monthly}
				companyMonthly={viewData.company_monthly}
				insuranceMonthly={viewData.insurance_monthly}
				{capitalIncome}
			/>

			{#snippet aside()}
				<Explanation title={m.payout_explanation_income_title()}>
					<p>{m.payout_explanation_income_fixed_text()}</p>
					<p class="mt-2">{m.payout_explanation_income_capital_text()}</p>
					<p class="mt-2">{m.payout_explanation_income_reliability_text()}</p>
				</Explanation>
			{/snippet}
		</ContentSection>

		<!-- Section C: Member-specific pension list OR household summary -->
		{#if selectedMember}
			<ContentSection>
				<MemberPensionList pensions={memberPensions} />

				{#snippet aside()}
					<Explanation title={m.payout_explanation_pension_plans_title()}>
						<p>{m.payout_explanation_pension_plans_text()}</p>
					</Explanation>
				{/snippet}
			</ContentSection>
		{:else if data.members.length > 1}
			<MemberSummaryCards
				members={data.members}
				analyses={data.analyses}
				pensions={data.pensions}
				onSelectMember={(id) => (selectedMemberId = id)}
			/>
		{/if}

		<!-- Section D: Drawdown Chart -->
		<ContentSection>
			<Card
				title={m.payout_drawdown_chart_title()}
				description={m.payout_drawdown_chart_description()}
			>
				<DrawdownChart {drawdownPoints} {withdrawalYears} />
			</Card>

			{#snippet aside()}
				<Explanation title={m.payout_explanation_drawdown_title()}>
					<p>{m.payout_explanation_drawdown_text()}</p>
					<p class="mt-2">{m.payout_explanation_depletion_text()}</p>
					<ExplanationAlert>
						{m.payout_explanation_rate_note()}
					</ExplanationAlert>
				</Explanation>
			{/snippet}
		</ContentSection>
	{/if}
</div>
