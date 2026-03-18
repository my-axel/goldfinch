<!--
@file src/routes/plan/[member_id]/+page.svelte
@kind route
@purpose Unified retirement plan detail page — collapsible config above tabs, Tab 1: Analysis (results + timeline), Tab 2: Payout (capital + income + drawdown + pensions).
-->

<script lang="ts">
	import { untrack } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { compassApi } from '$lib/api/compass';
	import type { RetirementGapConfig, GapAnalysisResult, GapTimeline } from '$lib/types/compass';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CollapsibleCard from '$lib/components/ui/CollapsibleCard.svelte';
	import ContentSection from '$lib/components/ui/ContentSection.svelte';
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import ExplanationAlert from '$lib/components/ui/ExplanationAlert.svelte';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import GapConfigForm from '$lib/components/compass/GapConfigForm.svelte';
	import GapResultDisplay from '$lib/components/compass/GapResultDisplay.svelte';
	import GapBreakdown from '$lib/components/compass/GapBreakdown.svelte';
	import GapTimelineChart from '$lib/components/compass/GapTimelineChart.svelte';
	import CapitalOverview from '$lib/components/payout/CapitalOverview.svelte';
	import IncomeBreakdown from '$lib/components/payout/IncomeBreakdown.svelte';
	import DrawdownChart from '$lib/components/payout/DrawdownChart.svelte';
	import MemberPensionList from '$lib/components/payout/MemberPensionList.svelte';

	let { data } = $props();

	// ── Tab state ────────────────────────────────────────────────────────────────
	let activeTab = $state<'analysis' | 'payout'>('analysis');

	// ── Config collapse state ────────────────────────────────────────────────────
	// Collapsed when config exists (user already set it up), expanded when no config
	let configCollapsed = $state(untrack(() => !!data.config));

	// ── Local overrides (same pattern as compass detail) ─────────────────────────
	let localConfig = $state<RetirementGapConfig | null | undefined>(undefined);
	let localAnalysis = $state<GapAnalysisResult | null | undefined>(undefined);
	let localTimeline = $state<GapTimeline | null | undefined>(undefined);

	const config = $derived(localConfig !== undefined ? localConfig : data.config);
	const analysis = $derived(localAnalysis !== undefined ? localAnalysis : data.analysis);
	const timeline = $derived(localTimeline !== undefined ? localTimeline : data.timeline);

	async function handleSave(savedConfig: RetirementGapConfig, savedAnalysis: GapAnalysisResult) {
		localConfig = savedConfig;
		localAnalysis = savedAnalysis;
		withdrawalUntilAge = savedConfig.withdrawal_until_age;
		configCollapsed = true;
		try {
			localTimeline = await compassApi.getTimeline(data.member.id);
		} catch {
			localTimeline = null;
		}
	}

	function handleDelete() {
		localConfig = null;
		localAnalysis = null;
		localTimeline = null;
		configCollapsed = false;
	}

	// ── Payout tab derivations ───────────────────────────────────────────────────
	const n = (v: unknown): number => Number(v) || 0;

	// "Until age" is the primary UX input; withdrawalYears is derived from it
	// untrack: intentional initial-only read from reactive prop
	const retirementAgePlanned = untrack(() => data.member.retirement_age_planned);
	let withdrawalUntilAge = $state(
		untrack(() => data.config?.withdrawal_until_age ?? Math.min(105, retirementAgePlanned + 25))
	);
	const withdrawalYears = $derived(Math.max(1, withdrawalUntilAge - retirementAgePlanned));

	const capitalIncome = $derived.by(() => {
		if (!analysis) return null;
		return {
			pessimistic: Math.max(0, n(analysis.remaining_monthly_gap.pessimistic)),
			realistic: Math.max(0, n(analysis.remaining_monthly_gap.realistic)),
			optimistic: Math.max(0, n(analysis.remaining_monthly_gap.optimistic))
		};
	});

	interface DrawdownPoint {
		year: number;
		pessimistic: number;
		realistic: number;
		optimistic: number;
	}

	const drawdownPoints = $derived.by((): DrawdownPoint[] => {
		if (!analysis) return [];

		const rates = {
			pessimistic: data.settings.projection_pessimistic_rate / 100,
			realistic: data.settings.projection_realistic_rate / 100,
			optimistic: data.settings.projection_optimistic_rate / 100
		};

		const annualWithdrawal = {
			pessimistic: Math.max(0, n(analysis.remaining_monthly_gap.pessimistic)) * 12,
			realistic: Math.max(0, n(analysis.remaining_monthly_gap.realistic)) * 12,
			optimistic: Math.max(0, n(analysis.remaining_monthly_gap.optimistic)) * 12
		};

		let cap = {
			pessimistic: n(analysis.projected_capital.pessimistic),
			realistic: n(analysis.projected_capital.realistic),
			optimistic: n(analysis.projected_capital.optimistic)
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

<div class="space-y-6">
	<!-- Back link -->
	<a
		href="/plan"
		class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
	>
		← {m.plan_back_to_overview()}
	</a>

	<PageHeader
		title={m.plan_detail_title({ name: data.member.first_name })}
		description={m.plan_description()}
	/>

	<!-- ═══ CONFIG (above tabs, collapsible) ══════════════════════════════════ -->
	<ContentSection>
		<CollapsibleCard
			title={m.compass_gap_setup_title()}
			description={m.compass_gap_setup_description()}
			bind:collapsed={configCollapsed}
		>
			{#snippet summary()}
				{#if config}
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
						<div>
							<p class="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{m.plan_config_summary_net_income()}</p>
							<FormattedCurrency value={config.net_monthly_income} decimals={0} class="text-sm font-semibold" />
						</div>
						<div>
							<p class="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{m.plan_config_summary_replacement_rate()}</p>
							<p class="text-sm font-semibold">{Math.round(config.replacement_rate * 100)}%</p>
						</div>
						<div>
							<p class="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{m.plan_config_summary_until_age_label()}</p>
							<p class="text-sm font-semibold">{m.plan_config_summary_until_age({ age: config.withdrawal_until_age })}</p>
						</div>
						<div>
							<p class="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{m.plan_config_summary_capital_label()}</p>
							<p class="text-sm font-semibold">{config.capital_depletion ? m.plan_config_summary_capital_depletion() : m.plan_config_summary_no_depletion()}</p>
						</div>
						<div>
							<p class="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{m.plan_config_summary_salary_growth()}</p>
							<p class="text-sm font-semibold">{config.annual_salary_growth_rate}% p.a.</p>
						</div>
					</div>
				{/if}
			{/snippet}

			<GapConfigForm
				memberId={data.member.id}
				retirementAge={retirementAgePlanned}
				{config}
				onSave={handleSave}
				onDelete={handleDelete}
			/>
		</CollapsibleCard>

		{#if !configCollapsed}
			{#snippet aside()}
				<Explanation title={m.compass_explanation_title()}>
					<p>{m.compass_explanation_formula()}</p>
					<p class="mt-2">{m.compass_explanation_income()}</p>
					<p class="mt-2">{m.compass_explanation_replacement_rate()}</p>
					<p class="mt-2">{m.compass_explanation_capital_plan()}</p>
					{#if config?.desired_monthly_pension != null}
						<p class="mt-2">{m.compass_explanation_desired_pension()}</p>
					{/if}
				</Explanation>
			{/snippet}
		{/if}
	</ContentSection>

	<!-- Tab navigation -->
	<div class="flex border-b border-border">
		<button
			class="px-4 py-2.5 text-sm font-medium transition-colors relative
				{activeTab === 'analysis'
					? 'text-foreground'
					: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'analysis')}
		>
			{m.plan_tab_analysis()}
			{#if activeTab === 'analysis'}
				<span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
			{/if}
		</button>
		<button
			class="px-4 py-2.5 text-sm font-medium transition-colors relative
				{activeTab === 'payout'
					? 'text-foreground'
					: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'payout')}
		>
			{m.plan_tab_payout()}
			{#if activeTab === 'payout'}
				<span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
			{/if}
		</button>
	</div>

	<!-- ═══ TAB 1: ANALYSIS ═══════════════════════════════════════════════════ -->
	{#if activeTab === 'analysis'}
		{#if analysis}
			<!-- Results section -->
			<ContentSection>
				<Card title={m.compass_gap_results_card_title()}>
					<GapResultDisplay result={analysis} />
					<GapBreakdown result={analysis} />
				</Card>

				{#snippet aside()}
					<Explanation title={m.compass_explanation_results_title()}>
						<p>{m.compass_explanation_results_text()}</p>
						<p class="mt-2">{m.compass_explanation_capital_note_text()}</p>
					</Explanation>
				{/snippet}
			</ContentSection>

			<!-- Timeline chart -->
			{#if timeline}
				<Card title={m.compass_timeline_title()} description={m.compass_timeline_description()}>
					<GapTimelineChart
						timelines={[timeline]}
						analyses={[analysis]}
						members={[data.member]}
						householdOnly={true}
					/>
				</Card>
			{/if}
		{:else}
			<Card title={m.compass_gap_results_card_title()}>
				<p class="text-sm text-muted-foreground">{m.compass_gap_no_config_cta()}</p>
				<button
					class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
					onclick={() => (configCollapsed = false)}
				>
					{m.compass_gap_setup_title()} →
				</button>
			</Card>
		{/if}

	<!-- ═══ TAB 2: PAYOUT ═════════════════════════════════════════════════════ -->
	{:else if activeTab === 'payout'}
		{#if !analysis || !capitalIncome}
			<!-- No analysis configured yet -->
			<ContentSection>
				<Card title={m.payout_no_data_title()}>
					<p class="text-sm text-muted-foreground">{m.payout_no_data_description()}</p>
					<button
						class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
						onclick={() => (configCollapsed = false)}
					>
						{m.compass_gap_setup_title()} →
					</button>
				</Card>

				{#snippet aside()}
					<Explanation title={m.payout_explanation_capital_title()}>
						<p>{m.payout_explanation_capital_text()}</p>
						<p class="mt-2">{m.payout_explanation_swr_text()}</p>
					</Explanation>
				{/snippet}
			</ContentSection>
		{:else}
			<!-- Capital Overview -->
			<ContentSection>
				<CapitalOverview
					projectedCapital={analysis.projected_capital}
					{capitalIncome}
					yearsToRetirement={n(analysis.years_to_retirement)}
					retirementAge={retirementAgePlanned}
					bind:withdrawalUntilAge
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

			<!-- Income Breakdown -->
			<ContentSection>
				<IncomeBreakdown
					stateMonthly={analysis.breakdown.state_monthly}
					companyMonthly={n(analysis.breakdown.company_monthly)}
					insuranceMonthly={n(analysis.breakdown.insurance_monthly)}
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

			<!-- Drawdown Chart -->
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

			<!-- Member Pension List -->
			<ContentSection>
				<MemberPensionList pensions={data.pensions} />

				{#snippet aside()}
					<Explanation title={m.payout_explanation_pension_plans_title()}>
						<p>{m.payout_explanation_pension_plans_text()}</p>
					</Explanation>
				{/snippet}
			</ContentSection>
		{/if}
	{/if}
</div>
