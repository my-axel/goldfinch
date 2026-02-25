<!--
@file src/lib/components/pension/savings/BasicInformationCard.svelte
@kind component
@purpose Kapselt den UI-Abschnitt 'BasicInformationCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { CompoundingFrequency } from '$lib/types/pension';

	let {
		name = $bindable(''),
		startDate = $bindable(''),
		compoundingFrequency = $bindable(CompoundingFrequency.ANNUALLY),
		notes = $bindable(''),
		errors = {}
	}: {
		name: string;
		startDate: string;
		compoundingFrequency: CompoundingFrequency;
		notes: string;
		errors?: { name?: string; start_date?: string };
	} = $props();

	const compoundingOptions: { value: CompoundingFrequency; label: () => string }[] = [
		{ value: CompoundingFrequency.DAILY, label: () => m.savings_pension_compounding_daily() },
		{ value: CompoundingFrequency.MONTHLY, label: () => m.savings_pension_compounding_monthly() },
		{ value: CompoundingFrequency.QUARTERLY, label: () => m.savings_pension_compounding_quarterly() },
		{ value: CompoundingFrequency.SEMI_ANNUALLY, label: () => m.savings_pension_compounding_semi_annually() },
		{ value: CompoundingFrequency.ANNUALLY, label: () => m.savings_pension_compounding_annually() }
	];
</script>

<div class="space-y-6">
	<!-- Name -->
	<div>
		<label class="block text-sm font-medium mb-1.5">
			{m.savings_pension_name()}
			<input
				type="text"
				bind:value={name}
				placeholder={m.savings_pension_name_placeholder()}
				class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
					{errors.name ? 'border-destructive' : ''}"
			/>
		</label>
		{#if errors.name}
			<p class="text-xs text-destructive mt-1">{errors.name}</p>
		{/if}
	</div>

	<!-- Start Date and Compounding Frequency -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div>
			<label class="block text-sm font-medium mb-1.5">
				{m.savings_pension_start_date()}
				<input
					type="date"
					bind:value={startDate}
					class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
						{errors.start_date ? 'border-destructive' : ''}"
				/>
			</label>
			{#if errors.start_date}
				<p class="text-xs text-destructive mt-1">{errors.start_date}</p>
			{/if}
		</div>

		<div>
			<label class="block text-sm font-medium mb-1.5">
				{m.savings_pension_compounding_frequency()}
				<select
					bind:value={compoundingFrequency}
					class="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					{#each compoundingOptions as opt}
						<option value={opt.value}>{opt.label()}</option>
					{/each}
				</select>
			</label>
		</div>
	</div>

	<!-- Notes -->
	<div>
		<label class="block text-sm font-medium mb-1.5">
			{m.savings_pension_notes()}
			<textarea
				bind:value={notes}
				placeholder={m.savings_pension_notes_placeholder()}
				rows="3"
				class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
			></textarea>
		</label>
	</div>
</div>
