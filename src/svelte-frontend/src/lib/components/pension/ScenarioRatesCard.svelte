<!--
@file src/lib/components/pension/ScenarioRatesCard.svelte
@kind component
@purpose Kapselt den UI-Abschnitt 'ScenarioRatesCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import PercentInput from '$lib/components/ui/PercentInput.svelte';

	let {
		pessimisticRate = $bindable(0.04),
		realisticRate = $bindable(0.07),
		optimisticRate = $bindable(0.10)
	}: {
		pessimisticRate: number;
		realisticRate: number;
		optimisticRate: number;
	} = $props();
</script>

<div class="space-y-6">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="block text-sm font-medium mb-1.5">
				{m.pension_scenario_pessimistic_rate()}
			</label>
			<PercentInput bind:value={pessimisticRate} max={0.20} decimals={1} />
		</div>

		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="block text-sm font-medium mb-1.5">
				{m.pension_scenario_realistic_rate()}
			</label>
			<PercentInput bind:value={realisticRate} max={0.20} decimals={1} />
		</div>

		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="block text-sm font-medium mb-1.5">
				{m.pension_scenario_optimistic_rate()}
			</label>
			<PercentInput bind:value={optimisticRate} max={0.20} decimals={1} />
		</div>
	</div>
</div>
