<!--
@file src/lib/components/payout/IncomeBreakdown.svelte
@kind component
@purpose Einkommensaufschluesselung nach Pensionstyp und Szenario mit Proportion-Bar.
-->

<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { GapScenarios } from '$lib/types/compass';

	const n = (v: unknown): number => Number(v) || 0;

	let {
		stateMonthly,
		companyMonthly,
		insuranceMonthly,
		capitalIncome
	}: {
		stateMonthly: GapScenarios;
		companyMonthly: number;
		insuranceMonthly: number;
		capitalIncome: GapScenarios;
	} = $props();

	const fixedIncome = $derived({
		pessimistic: n(stateMonthly.pessimistic) + companyMonthly + insuranceMonthly,
		realistic: n(stateMonthly.realistic) + companyMonthly + insuranceMonthly,
		optimistic: n(stateMonthly.optimistic) + companyMonthly + insuranceMonthly
	});

	const fixedRatio = $derived.by(() => {
		const f = fixedIncome.realistic;
		const c = capitalIncome.realistic;
		const total = f + c;
		return total > 0 ? f / total : 0;
	});
</script>

<Card title={m.payout_income_breakdown_title()}>
	<!-- Column headers -->
	<div class="grid grid-cols-4 gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground pb-2 border-b border-border">
		<div></div>
		<div class="text-right">{m.settings_pessimistic()}</div>
		<div class="text-right">{m.settings_realistic()}</div>
		<div class="text-right">{m.settings_optimistic()}</div>
	</div>

	<!-- State pension row -->
	<div class="grid grid-cols-4 gap-2 items-center py-2.5 border-b border-border/50">
		<div class="text-sm text-muted-foreground">{m.payout_state_pension_label()}</div>
		<div class="text-right text-sm tabular-nums">
			<FormattedCurrency value={n(stateMonthly.pessimistic)} decimals={0} />
		</div>
		<div class="text-right text-sm font-medium tabular-nums">
			<FormattedCurrency value={n(stateMonthly.realistic)} decimals={0} />
		</div>
		<div class="text-right text-sm tabular-nums">
			<FormattedCurrency value={n(stateMonthly.optimistic)} decimals={0} />
		</div>
	</div>

	<!-- Company pension row (fixed, same across scenarios) -->
	{#if companyMonthly > 0}
		<div class="grid grid-cols-4 gap-2 items-center py-2.5 border-b border-border/50">
			<div class="text-sm text-muted-foreground">{m.payout_company_pension_label()}</div>
			<div class="text-right text-sm tabular-nums">
				<FormattedCurrency value={n(companyMonthly)} decimals={0} />
			</div>
			<div class="text-right text-sm font-medium tabular-nums">
				<FormattedCurrency value={n(companyMonthly)} decimals={0} />
			</div>
			<div class="text-right text-sm tabular-nums">
				<FormattedCurrency value={n(companyMonthly)} decimals={0} />
			</div>
		</div>
	{/if}

	<!-- Insurance pension row (fixed) -->
	{#if insuranceMonthly > 0}
		<div class="grid grid-cols-4 gap-2 items-center py-2.5 border-b border-border/50">
			<div class="text-sm text-muted-foreground">{m.payout_insurance_pension_label()}</div>
			<div class="text-right text-sm tabular-nums">
				<FormattedCurrency value={n(insuranceMonthly)} decimals={0} />
			</div>
			<div class="text-right text-sm font-medium tabular-nums">
				<FormattedCurrency value={n(insuranceMonthly)} decimals={0} />
			</div>
			<div class="text-right text-sm tabular-nums">
				<FormattedCurrency value={n(insuranceMonthly)} decimals={0} />
			</div>
		</div>
	{/if}

	<!-- Capital withdrawal row -->
	<div class="grid grid-cols-4 gap-2 items-center py-2.5 border-b border-border/50">
		<div class="text-sm text-muted-foreground">{m.payout_capital_income_label()}</div>
		<div class="text-right text-sm tabular-nums">
			<FormattedCurrency value={capitalIncome.pessimistic} decimals={0} />
		</div>
		<div class="text-right text-sm font-medium tabular-nums">
			<FormattedCurrency value={capitalIncome.realistic} decimals={0} />
		</div>
		<div class="text-right text-sm tabular-nums">
			<FormattedCurrency value={capitalIncome.optimistic} decimals={0} />
		</div>
	</div>

	<!-- Total row -->
	<div class="grid grid-cols-4 gap-2 items-center py-2.5 mt-1">
		<div class="text-sm font-semibold">{m.payout_total_income_label()}</div>
		<div class="text-right text-sm font-semibold tabular-nums">
			<FormattedCurrency value={fixedIncome.pessimistic + capitalIncome.pessimistic} decimals={0} />
		</div>
		<div class="text-right text-sm font-bold tabular-nums">
			<FormattedCurrency value={fixedIncome.realistic + capitalIncome.realistic} decimals={0} />
		</div>
		<div class="text-right text-sm font-semibold tabular-nums">
			<FormattedCurrency value={fixedIncome.optimistic + capitalIncome.optimistic} decimals={0} />
		</div>
	</div>

	<!-- Proportion bar (realistic scenario) -->
	{#if (fixedIncome.realistic + capitalIncome.realistic) > 0}
		<div class="mt-4 space-y-1.5">
			<div class="flex justify-between text-[11px] text-muted-foreground">
				<span class="flex items-center gap-1.5">
					<span class="inline-block w-2.5 h-2.5 rounded-sm bg-primary/70"></span>
					{m.payout_fixed_income_label()} — {Math.round(fixedRatio * 100)}%
				</span>
				<span class="flex items-center gap-1.5">
					{Math.round((1 - fixedRatio) * 100)}% — {m.payout_capital_income_label()}
					<span class="inline-block w-2.5 h-2.5 rounded-sm bg-primary/30"></span>
				</span>
			</div>
			<div class="h-2.5 rounded-full overflow-hidden bg-muted flex">
				<div
					class="bg-primary/70 h-full transition-all duration-300"
					style="width: {(fixedRatio * 100).toFixed(1)}%"
				></div>
				<div class="bg-primary/30 h-full flex-1"></div>
			</div>
		</div>
	{/if}
</Card>
