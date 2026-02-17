<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { pensionApi } from '$lib/api/pension';
	import { formatCurrency, formatNumber } from '$lib/utils/format';
	import { TrendingDown, ArrowRight, TrendingUp, ChevronRight } from '@lucide/svelte';
	import type { StatePensionProjection, StatePensionScenario } from '$lib/types/pension';

	let {
		pensionId
	}: {
		pensionId: number;
	} = $props();

	let scenariosData = $state<StatePensionProjection | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let detailsOpen = $state(false);

	onMount(async () => {
		try {
			scenariosData = await pensionApi.getStatePensionScenarios(pensionId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load scenarios';
		} finally {
			loading = false;
		}
	});

	function fmt(scenario: StatePensionScenario) {
		const locale = settingsStore.current.number_locale;
		const currency = settingsStore.current.currency;
		return {
			monthlyAmount: formatCurrency(scenario.monthly_amount, locale, currency, 0),
			annualAmount: formatCurrency(scenario.annual_amount, locale, currency, 0),
			growthRate: `${formatNumber(scenario.growth_rate, locale, 1)}%`
		};
	}

	let hasData = $derived(
		scenariosData &&
		scenariosData.planned &&
		scenariosData.possible &&
		scenariosData.planned.pessimistic &&
		scenariosData.planned.realistic &&
		scenariosData.planned.optimistic &&
		scenariosData.possible.pessimistic &&
		scenariosData.possible.realistic &&
		scenariosData.possible.optimistic
	);

	let planned = $derived(hasData ? {
		pessimistic: fmt(scenariosData!.planned.pessimistic),
		realistic: fmt(scenariosData!.planned.realistic),
		optimistic: fmt(scenariosData!.planned.optimistic),
		retirementAge: scenariosData!.planned.realistic.retirement_age,
		yearsToRetirement: scenariosData!.planned.realistic.years_to_retirement
	} : null);

	let possible = $derived(hasData ? {
		pessimistic: fmt(scenariosData!.possible.pessimistic),
		realistic: fmt(scenariosData!.possible.realistic),
		optimistic: fmt(scenariosData!.possible.optimistic),
		retirementAge: scenariosData!.possible.realistic.retirement_age,
		yearsToRetirement: scenariosData!.possible.realistic.years_to_retirement
	} : null);
</script>

{#if loading}
	<div class="space-y-4">
		<div class="h-24 w-full rounded-lg bg-muted animate-pulse"></div>
		<div class="h-24 w-full rounded-lg bg-muted animate-pulse"></div>
	</div>
{:else if error}
	<div class="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
		{m.state_pension_scenarios_error()}
	</div>
{:else if !hasData}
	<div class="bg-muted/50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
		{m.state_pension_no_scenarios()}
	</div>
{:else if planned && possible}
	<div class="space-y-6">
		<!-- Planned Retirement Age Scenarios -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold">
				{m.state_pension_planned_retirement({ age: planned.retirementAge.toString() })}
			</h3>
			<p class="text-sm text-muted-foreground">
				{m.state_pension_planned_retirement_description({ years: planned.yearsToRetirement.toString() })}
			</p>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{@render scenarioCard(TrendingDown, m.state_pension_pessimistic(), planned.pessimistic.monthlyAmount, planned.pessimistic.growthRate)}
				{@render scenarioCard(ArrowRight, m.state_pension_realistic(), planned.realistic.monthlyAmount, planned.realistic.growthRate)}
				{@render scenarioCard(TrendingUp, m.state_pension_optimistic(), planned.optimistic.monthlyAmount, planned.optimistic.growthRate)}
			</div>

			<p class="text-sm text-muted-foreground mt-2">
				{m.state_pension_annual_amounts({
					pessimistic: planned.pessimistic.annualAmount,
					realistic: planned.realistic.annualAmount,
					optimistic: planned.optimistic.annualAmount
				})}
			</p>
		</div>

		<!-- Alternative Retirement Age Scenarios -->
		<div class="space-y-4 pt-6 border-t border-border">
			<h3 class="text-lg font-semibold">
				{m.state_pension_alternative_retirement({ age: possible.retirementAge.toString() })}
			</h3>
			<p class="text-sm text-muted-foreground">
				{m.state_pension_alternative_retirement_description({ age: possible.retirementAge.toString(), years: possible.yearsToRetirement.toString() })}
			</p>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{@render scenarioCard(TrendingDown, m.state_pension_pessimistic(), possible.pessimistic.monthlyAmount, possible.pessimistic.growthRate)}
				{@render scenarioCard(ArrowRight, m.state_pension_realistic(), possible.realistic.monthlyAmount, possible.realistic.growthRate)}
				{@render scenarioCard(TrendingUp, m.state_pension_optimistic(), possible.optimistic.monthlyAmount, possible.optimistic.growthRate)}
			</div>

			<p class="text-sm text-muted-foreground mt-2">
				{m.state_pension_annual_amounts({
					pessimistic: possible.pessimistic.annualAmount,
					realistic: possible.realistic.annualAmount,
					optimistic: possible.optimistic.annualAmount
				})}
			</p>
		</div>

		<!-- Expandable Details -->
		<div class="rounded-lg transition-colors {detailsOpen ? 'bg-muted' : ''}">
			<button
				type="button"
				onclick={() => detailsOpen = !detailsOpen}
				class="flex w-full justify-between items-center p-4 font-normal hover:bg-transparent
					{detailsOpen ? 'border-b border-border' : ''}"
			>
				<span class="font-semibold opacity-80">
					{detailsOpen ? m.state_pension_hide_details() : m.state_pension_show_details()}
				</span>
				<ChevronRight class="h-4 w-4 transition-transform {detailsOpen ? 'rotate-90' : ''}" />
			</button>

			{#if detailsOpen}
				<div class="p-4 space-y-4">
					<div>
						<h4 class="font-medium text-sm mb-1">{m.state_pension_understanding_growth()}</h4>
						<p class="text-sm text-muted-foreground">
							{m.state_pension_understanding_growth_text()}
						</p>
					</div>

					<div>
						<h4 class="font-medium text-sm mb-1">{m.state_pension_delayed_benefits()}</h4>
						<ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
							<li>{m.state_pension_delayed_benefit_1()}</li>
							<li>{m.state_pension_delayed_benefit_2()}</li>
							<li>{m.state_pension_delayed_benefit_3()}</li>
						</ul>
					</div>

					<div>
						<h4 class="font-medium text-sm mb-1">{m.state_pension_considerations()}</h4>
						<ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
							<li>{m.state_pension_consideration_1()}</li>
							<li>{m.state_pension_consideration_2()}</li>
							<li>{m.state_pension_consideration_3()}</li>
						</ul>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#snippet scenarioCard(Icon: typeof TrendingDown, label: string, amount: string, rate: string)}
	<div class="flex flex-col items-center p-4 rounded-lg border border-border bg-card">
		<Icon class="h-5 w-5 text-muted-foreground mb-2" />
		<span class="text-xs text-muted-foreground mb-1">{label}</span>
		<span class="text-lg font-semibold">{amount}</span>
		<span class="text-xs text-muted-foreground">{rate}</span>
	</div>
{/snippet}
