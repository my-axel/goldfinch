<!--
@file src/lib/components/compass/GapResultDisplay.svelte
@kind component
@purpose Shows computed gap analysis results. Realistic scenario is the primary hero block;
  pessimistic and optimistic shown as compact secondary rows.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import type { GapAnalysisResult } from '$lib/types/compass';
	import { gapStatusFor, toGapDisplayValue } from '$lib/utils/retirement-gap';
	import { settingsStore } from '$lib/stores/settings.svelte';

	let { result }: { result: GapAnalysisResult } = $props();

	const s = $derived(settingsStore.current);

	const realisticDisplay = $derived(toGapDisplayValue(result.remaining_monthly_gap.realistic));
	const pessimisticDisplay = $derived(toGapDisplayValue(result.remaining_monthly_gap.pessimistic));
	const optimisticDisplay = $derived(toGapDisplayValue(result.remaining_monthly_gap.optimistic));

	const realisticStatus = $derived(
		gapStatusFor(result.gap.realistic, result.required_capital_adjusted.realistic)
	);
	const pessimisticStatus = $derived(
		gapStatusFor(result.gap.pessimistic, result.required_capital_adjusted.pessimistic)
	);
	const optimisticStatus = $derived(
		gapStatusFor(result.gap.optimistic, result.required_capital_adjusted.optimistic)
	);

	const realisticValueCls = $derived(
		realisticStatus === 'on_track'
			? 'text-green-600 dark:text-green-400'
			: realisticStatus === 'needs_attention'
				? 'text-yellow-600 dark:text-yellow-400'
				: 'text-red-600 dark:text-red-400'
	);

	const fixedMonthlyIncome = $derived(
		Number(result.breakdown.company_monthly) + Number(result.breakdown.insurance_monthly)
	);
</script>

<div class="space-y-5">
	{#if result.retirement_already_reached}
		<div
			class="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300"
		>
			{m.compass_gap_retirement_already_reached()}
		</div>
	{/if}

	<!-- Context metrics -->
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
		</div>
		<div class="space-y-0.5">
			<p class="text-xs text-muted-foreground">{m.compass_gap_years_to_retirement()}</p>
			<p class="text-base font-semibold">
				{Math.max(0, Math.round(result.years_to_retirement))} yrs
			</p>
		</div>
	</div>

	<!-- Primary: realistic scenario -->
	<div class="rounded-lg border border-border bg-muted/20 p-4">
		<p class="text-xs text-muted-foreground uppercase tracking-wide mb-2">
			{m.settings_realistic()} · {s.state_pension_realistic_rate}% / {s.projection_realistic_rate}%
		</p>
		{#if realisticDisplay}
			<p class="text-3xl font-bold {realisticValueCls}">
				{#if realisticStatus === 'on_track'}+{/if}<FormattedCurrency
					value={realisticDisplay.absolute}
					decimals={0}
				/>
				<span class="text-sm font-normal ml-1">/Mo</span>
			</p>
			<p class="text-sm text-muted-foreground mt-1">
				{realisticStatus === 'on_track' ? m.compass_gap_surplus() : m.compass_gap_shortfall()}
			</p>
		{/if}

		<!-- Sub-metrics: required capital -->
		<div class="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
			<div>
				<p class="text-xs text-muted-foreground">{m.compass_gap_required_capital_adjusted()}</p>
				<p class="text-sm font-medium">
					<FormattedCurrency value={result.required_capital_adjusted.realistic} decimals={0} />
				</p>
			</div>
			<div>
				<p class="text-xs text-muted-foreground">{m.compass_gap_projected_capital()}</p>
				<p class="text-sm font-medium">
					<FormattedCurrency value={result.projected_capital.realistic} decimals={0} />
				</p>
			</div>
			{#if fixedMonthlyIncome > 0}
				<div>
					<p class="text-xs text-muted-foreground">{m.compass_gap_fixed_income()}</p>
					<p class="text-sm font-medium">
						+<FormattedCurrency value={fixedMonthlyIncome} decimals={0} />/Mo
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Secondary: pessimistic + optimistic -->
	<div class="grid grid-cols-2 gap-3">
		<div class="rounded-lg border border-border bg-muted/10 px-3 py-2.5">
			<p class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
				{m.settings_pessimistic()} · {s.state_pension_pessimistic_rate}% / {s.projection_pessimistic_rate}%
			</p>
			{#if pessimisticDisplay}
				<p class="text-sm font-semibold" style="color: hsl(320, 65%, 55%)">
					{#if pessimisticStatus === 'on_track'}+{/if}<FormattedCurrency
						value={pessimisticDisplay.absolute}
						decimals={0}
					/>/Mo
				</p>
				<p class="text-xs text-muted-foreground">
					{pessimisticStatus === 'on_track' ? m.compass_gap_surplus() : m.compass_gap_shortfall()}
				</p>
			{/if}
		</div>
		<div class="rounded-lg border border-border bg-muted/10 px-3 py-2.5">
			<p class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
				{m.settings_optimistic()} · {s.state_pension_optimistic_rate}% / {s.projection_optimistic_rate}%
			</p>
			{#if optimisticDisplay}
				<p class="text-sm font-semibold" style="color: hsl(142, 70%, 45%)">
					{#if optimisticStatus === 'on_track'}+{/if}<FormattedCurrency
						value={optimisticDisplay.absolute}
						decimals={0}
					/>/Mo
				</p>
				<p class="text-xs text-muted-foreground">
					{optimisticStatus === 'on_track' ? m.compass_gap_surplus() : m.compass_gap_shortfall()}
				</p>
			{/if}
		</div>
	</div>
</div>
