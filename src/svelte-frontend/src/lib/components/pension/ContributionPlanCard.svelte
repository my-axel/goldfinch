<!--
@file src/lib/components/pension/ContributionPlanCard.svelte
@kind component
@purpose Kapselt den UI-Abschnitt 'ContributionPlanCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
@contains Kernfunktionen `addStep()`, `removeStep()` steuern Eingaben, Validierung und Benutzeraktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { ContributionFrequency, type ContributionStep } from '$lib/types/pension';
	import { addDaysIsoDate, todayIsoDate } from '$lib/utils/date-only';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let {
		steps = $bindable([]),
	}: {
		steps: ContributionStep[];
	} = $props();

	const frequencyOptions: { value: ContributionFrequency; label: () => string }[] = [
		{ value: ContributionFrequency.MONTHLY, label: () => m.pension_per_month() },
		{ value: ContributionFrequency.QUARTERLY, label: () => m.pension_per_quarter() },
		{ value: ContributionFrequency.SEMI_ANNUALLY, label: () => m.pension_per_half_year() },
		{ value: ContributionFrequency.ANNUALLY, label: () => m.pension_per_year() },
		{ value: ContributionFrequency.ONE_TIME, label: () => m.pension_one_time() }
	];

	function addStep() {
		let startDate = todayIsoDate();
		if (steps.length > 0) {
			const lastStep = steps[steps.length - 1];
			if (lastStep.end_date) {
				startDate = addDaysIsoDate(lastStep.end_date, 1);
			}
		}
		steps = [
			...steps,
			{
				amount: 0,
				frequency: ContributionFrequency.MONTHLY,
				start_date: startDate
			}
		];
	}

	function removeStep(index: number) {
		steps = steps.filter((_, i) => i !== index);
	}
</script>

<Card title={m.contribution_plan_title()}>
	{#if steps.length > 0}
		<!-- Header row -->
		<div class="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 mb-2">
			<span class="text-xs font-medium text-muted-foreground">{m.contribution_amount()}</span>
			<span class="text-xs font-medium text-muted-foreground">{m.contribution_frequency()}</span>
			<span class="text-xs font-medium text-muted-foreground">{m.contribution_start_date()}</span>
			<span class="text-xs font-medium text-muted-foreground">{m.contribution_end_date()}</span>
			<span class="w-9"></span>
		</div>

		<!-- Step rows -->
		{#each steps as step, i}
			<div class="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 mb-3 items-center">
				<CurrencyInput bind:value={step.amount} min={0} decimals={2} />

				<select
					bind:value={step.frequency}
					class="h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					{#each frequencyOptions as opt}
						<option value={opt.value}>{opt.label()}</option>
					{/each}
				</select>

				<input
					type="date"
					bind:value={step.start_date}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
				/>

				<input
					type="date"
					bind:value={step.end_date}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
				/>

				<button
					type="button"
					onclick={() => removeStep(i)}
					class="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent/50"
				>
					<Trash2 class="h-4 w-4" />
				</button>
			</div>
		{/each}
	{/if}

	<!-- Add button -->
	<button
		type="button"
		onclick={addStep}
		class="w-full border-2 border-dashed border-border rounded-lg py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
	>
		<Plus class="h-4 w-4" />
		{#if steps.length === 0}
			{m.contribution_add_first()}
		{:else}
			{m.contribution_add()}
		{/if}
	</button>
</Card>
