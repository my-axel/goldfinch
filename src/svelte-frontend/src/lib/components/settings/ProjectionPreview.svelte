<script lang="ts">
	import Explanation from '$lib/components/ui/Explanation.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let {
		locale,
		currency,
		inflationRate,
		pessimisticRate,
		realisticRate,
		optimisticRate
	}: {
		locale: string;
		currency: string;
		inflationRate: number;
		pessimisticRate: number;
		realisticRate: number;
		optimisticRate: number;
	} = $props();

	const currentValue = 100_000;
	const monthlyContribution = 1_000;
	const years = 30;

	function calculateProjection(annualRate: number, withInflation: boolean): number {
		const monthlyRate = annualRate / 100 / 12;
		const months = years * 12;

		const futureValue = currentValue * Math.pow(1 + monthlyRate, months);
		const contributionValue =
			monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
		const nominal = futureValue + contributionValue;

		if (withInflation && inflationRate > 0) {
			const monthlyInflation = inflationRate / 100 / 12;
			return nominal / Math.pow(1 + monthlyInflation, months);
		}
		return nominal;
	}

	function fmt(value: number): string {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
			maximumFractionDigits: 0
		}).format(value);
	}

	function fmtCurrency(value: number): string {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
			maximumFractionDigits: 0
		}).format(value);
	}
</script>

<div class="space-y-4">
	<Explanation title={m.projection_understanding_title()}>
		<p>
			{m.projection_understanding_text()}
		</p>
	</Explanation>

	<Explanation title={m.projection_example_title()}>
		<p>
			{m.projection_example_text({
				currentValue: fmtCurrency(currentValue),
				monthlyContribution: fmtCurrency(monthlyContribution),
				years: String(years),
				inflationRate: inflationRate.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
			})}
		</p>
	</Explanation>

	<Explanation title={m.projection_outcomes_title()}>
		<div class="grid grid-cols-3 gap-4">
			{#each [
				{ label: m.settings_pessimistic(), rate: pessimisticRate },
				{ label: m.settings_realistic(), rate: realisticRate },
				{ label: m.settings_optimistic(), rate: optimisticRate }
			] as scenario}
				<div class="space-y-2">
					<h5 class="font-medium text-xs">{scenario.label}</h5>
					<div>
						<p class="text-xs text-muted-foreground">{m.projection_nominal()}</p>
						<p class="text-xs font-bold">{fmt(calculateProjection(scenario.rate, false))}</p>
					</div>
					<div>
						<p class="text-xs text-muted-foreground">{m.projection_real()}</p>
						<p class="text-xs font-bold">{fmt(calculateProjection(scenario.rate, true))}</p>
					</div>
				</div>
			{/each}
		</div>
	</Explanation>
</div>
