<!--
@file src/lib/components/payout/CapitalOverview.svelte
@kind component
@purpose 3-Szenario-Kapitaluebersicht mit Years-to-Retirement und Withdrawal-Duration-Stepper.
-->

<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import StepperInput from '$lib/components/ui/StepperInput.svelte';
	import FormattedCurrency from '$lib/components/ui/FormattedCurrency.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { GapScenarios } from '$lib/types/compass';

	const n = (v: unknown): number => Number(v) || 0;

	let {
		projectedCapital,
		capitalIncome,
		yearsToRetirement,
		retirementAge,
		withdrawalUntilAge = $bindable()
	}: {
		projectedCapital: GapScenarios;
		capitalIncome: GapScenarios;
		yearsToRetirement: number;
		retirementAge: number;
		withdrawalUntilAge: number;
	} = $props();
</script>

<Card title={m.payout_capital_overview_title()}>
	<!-- 3-scenario capital grid -->
	<div class="grid grid-cols-3 gap-3">
		{#each [
			{ key: 'pessimistic', label: m.settings_pessimistic(), capital: projectedCapital.pessimistic, withdrawal: capitalIncome.pessimistic },
			{ key: 'realistic', label: m.settings_realistic(), capital: projectedCapital.realistic, withdrawal: capitalIncome.realistic },
			{ key: 'optimistic', label: m.settings_optimistic(), capital: projectedCapital.optimistic, withdrawal: capitalIncome.optimistic }
		] as scenario (scenario.key)}
			<div class="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
				<div class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
					{scenario.label}
				</div>
				<div>
					<div class="text-[10px] text-muted-foreground mb-0.5">{m.payout_capital_at_retirement_label()}</div>
					<div class="text-xl font-bold tabular-nums">
						<FormattedCurrency value={n(scenario.capital)} decimals={0} />
					</div>
				</div>
				{#if scenario.withdrawal > 0}
					<div>
						<div class="text-[10px] text-muted-foreground mb-0.5">{m.payout_monthly_withdrawal_label()}</div>
						<div class="text-sm font-semibold text-muted-foreground tabular-nums">
							<FormattedCurrency value={scenario.withdrawal} decimals={0} />/mo
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Years to retirement + withdrawal until age stepper -->
	<div class="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
		<div class="text-sm text-muted-foreground">
			{m.payout_years_to_retirement_label()}:
			<span class="font-semibold text-foreground ml-1">
				{Math.round(yearsToRetirement)}
				{m.payout_years_suffix()}
			</span>
		</div>
		<div class="flex items-center gap-3">
			<span class="text-sm text-muted-foreground">{m.payout_withdrawal_until_age_label()}:</span>
			<div class="w-28">
				<StepperInput bind:value={withdrawalUntilAge} min={retirementAge + 1} max={105} step={1} />
			</div>
		</div>
	</div>
</Card>
