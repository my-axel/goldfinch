<!--
@file src/lib/components/compass/GapResultDisplay.svelte
@kind component
@purpose Shows computed gap analysis results as a layered waterfall per scenario:
  state pension baseline gap → fixed income reduction → capital gap.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { GapAnalysisResult } from '$lib/types/compass';
	import { gapStatusFor, toGapDisplayValue } from '$lib/utils/retirement-gap';
	import { settingsStore } from '$lib/stores/settings.svelte';

	let { result }: { result: GapAnalysisResult } = $props();

	function gapColorClass(gap: number, requiredCapital: number): string {
		const status = gapStatusFor(gap, requiredCapital);
		if (status === 'on_track') return 'text-green-600 dark:text-green-400';
		if (status === 'needs_attention') return 'text-yellow-600 dark:text-yellow-400';
		return 'text-red-600 dark:text-red-400';
	}

	function gapLabel(gap: number): string {
		return gap <= 0 ? m.compass_gap_surplus() : m.compass_gap_shortfall();
	}

	const s = $derived(settingsStore.current);

	// Fixed income is the same across all scenarios (company + insurance are contract-based)
	const fixedMonthlyIncome = $derived(
		Number(result.breakdown.company_monthly) + Number(result.breakdown.insurance_monthly)
	);

	const scenarios = $derived([
		{
			label: m.settings_pessimistic(),
			portfolioRate: s.projection_pessimistic_rate,
			pensionRate: s.state_pension_pessimistic_rate,
			statePension: Number(result.breakdown.state_monthly.pessimistic),
			statePensionGap:
				Number(result.needed_monthly_at_retirement) -
				Number(result.breakdown.state_monthly.pessimistic),
			gap: Number(result.gap.pessimistic),
			projected: Number(result.projected_capital.pessimistic),
			requiredCapital: Number(result.required_capital_adjusted.pessimistic),
			display: toGapDisplayValue(result.gap.pessimistic)
		},
		{
			label: m.settings_realistic(),
			portfolioRate: s.projection_realistic_rate,
			pensionRate: s.state_pension_realistic_rate,
			statePension: Number(result.breakdown.state_monthly.realistic),
			statePensionGap:
				Number(result.needed_monthly_at_retirement) -
				Number(result.breakdown.state_monthly.realistic),
			gap: Number(result.gap.realistic),
			projected: Number(result.projected_capital.realistic),
			requiredCapital: Number(result.required_capital_adjusted.realistic),
			display: toGapDisplayValue(result.gap.realistic)
		},
		{
			label: m.settings_optimistic(),
			portfolioRate: s.projection_optimistic_rate,
			pensionRate: s.state_pension_optimistic_rate,
			statePension: Number(result.breakdown.state_monthly.optimistic),
			statePensionGap:
				Number(result.needed_monthly_at_retirement) -
				Number(result.breakdown.state_monthly.optimistic),
			gap: Number(result.gap.optimistic),
			projected: Number(result.projected_capital.optimistic),
			requiredCapital: Number(result.required_capital_adjusted.optimistic),
			display: toGapDisplayValue(result.gap.optimistic)
		}
	]);
</script>

<div class="space-y-6">
	{#if result.retirement_already_reached}
		<div class="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
			{m.compass_gap_retirement_already_reached()}
		</div>
	{/if}

	<!-- Key Metrics -->
	<div class="grid grid-cols-3 gap-4">
		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_needed_monthly()}</p>
			<p class="text-base font-semibold">
				<FormattedCurrency value={result.needed_monthly_at_retirement} decimals={0} />
			</p>
			{#if result.uses_override}
				<p class="text-xs text-muted-foreground">({m.compass_gap_uses_override()})</p>
			{:else}
				<p class="text-xs text-muted-foreground">
					<FormattedCurrency value={result.needed_monthly} decimals={0} />
					{m.compass_gap_needed_monthly_today()}
				</p>
			{/if}
		</div>

		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_salary_at_retirement_label()}</p>
			<p class="text-base font-semibold">
				<FormattedCurrency value={result.salary_at_retirement} decimals={0} />
			</p>
			<p class="text-xs text-muted-foreground">{m.compass_gap_salary_at_retirement_hint()}</p>
		</div>

		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_years_to_retirement()}</p>
			<p class="text-base font-semibold">{Math.max(0, Math.round(result.years_to_retirement))} yrs</p>
		</div>
	</div>

	<!-- Scenario Waterfall Cards -->
	<div>
		<p class="text-sm font-medium mb-3">{m.compass_gap_final_gap()}</p>
		<div class="grid grid-cols-3 gap-3">
			{#each scenarios as scenario (scenario.label)}
				<div class="rounded-lg border border-border bg-muted/30 p-3 text-center text-xs space-y-0">
					<!-- Scenario label + rates -->
					<div class="pb-2">
						<p class="text-sm font-medium">{scenario.label}</p>
						<p class="text-muted-foreground leading-tight mt-0.5">
							{m.compass_gap_scenario_pension_rate()}: {scenario.pensionRate}%
							&middot;
							{m.compass_gap_scenario_portfolio_rate()}: {scenario.portfolioRate}%
						</p>
					</div>

					<!-- State pension -->
					<div class="border-t border-border/50 py-2">
						<p class="text-muted-foreground">{m.compass_gap_breakdown_state()}</p>
						<p class="font-medium text-foreground">
							+<FormattedCurrency value={scenario.statePension} decimals={0} /><span class="text-muted-foreground">/Mo</span>
						</p>
					</div>

					<!-- State-pension-only gap — PRIMARY focal point -->
					<div class="border-t border-border/50 py-2">
						<p class="text-muted-foreground">{m.compass_gap_after_state_pension()}</p>
						<p class="text-base font-bold">
							<FormattedCurrency value={Math.max(0, scenario.statePensionGap)} decimals={0} /><span class="text-muted-foreground text-xs font-normal">/Mo</span>
						</p>
					</div>

					<!-- Fixed income: company + insurance (same in all scenarios) -->
					{#if fixedMonthlyIncome > 0}
						<div class="border-t border-border/50 py-2">
							<p class="text-muted-foreground">{m.compass_gap_fixed_income()}</p>
							<p class="font-medium text-foreground">
								+<FormattedCurrency value={fixedMonthlyIncome} decimals={0} /><span class="text-muted-foreground">/Mo</span>
							</p>
						</div>
					{/if}

					<!-- Required capital -->
					<div class="border-t border-border/50 py-2">
						<p class="text-muted-foreground">{m.compass_gap_required_capital_adjusted()}</p>
						<p class="font-medium text-foreground">
							<FormattedCurrency value={scenario.requiredCapital} decimals={0} />
						</p>
					</div>

					<!-- Projected portfolio capital -->
					<div class="pb-2">
						<p class="text-muted-foreground">{m.compass_gap_projected_capital()}</p>
						<p class="font-medium text-foreground">
							<FormattedCurrency value={scenario.projected} decimals={0} />
						</p>
					</div>

					<!-- Final gap -->
					{#if scenario.display}
						<div class="border-t border-border/50 pt-2">
							<p class="text-sm font-bold {gapColorClass(scenario.display.raw, scenario.requiredCapital)}">
								{#if scenario.display.isSurplus}+{/if}<FormattedCurrency
									value={scenario.display.absolute}
									decimals={0}
								/>
							</p>
							<p class="text-xs {gapColorClass(scenario.display.raw, scenario.requiredCapital)}">
								{gapLabel(scenario.display.raw)}
							</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
