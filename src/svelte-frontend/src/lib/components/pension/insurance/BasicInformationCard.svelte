<!--
@file src/lib/components/pension/insurance/BasicInformationCard.svelte
@kind component
@purpose Kapselt den UI-Abschnitt 'BasicInformationCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let {
		name = $bindable(''),
		provider = $bindable(''),
		contractNumber = $bindable(''),
		startDate = $bindable(''),
		notes = $bindable(''),
		errors = {}
	}: {
		name: string;
		provider: string;
		contractNumber: string;
		startDate: string;
		notes: string;
		errors?: { name?: string; start_date?: string; provider?: string };
	} = $props();
</script>

<div class="space-y-6">
	<!-- Name -->
	<div>
		<label class="block text-sm font-medium mb-1.5">
			{m.insurance_pension_name()}
			<input
				type="text"
				bind:value={name}
				placeholder={m.insurance_pension_name_placeholder()}
				class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
					{errors.name ? 'border-destructive' : ''}"
			/>
		</label>
		{#if errors.name}
			<p class="text-xs text-destructive mt-1">{errors.name}</p>
		{/if}
	</div>

	<!-- Provider and Contract Number -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div>
			<label class="block text-sm font-medium mb-1.5">
				{m.insurance_pension_provider()}
				<input
					type="text"
					bind:value={provider}
					placeholder={m.insurance_pension_provider_placeholder()}
					class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
						{errors.provider ? 'border-destructive' : ''}"
				/>
			</label>
			{#if errors.provider}
				<p class="text-xs text-destructive mt-1">{errors.provider}</p>
			{/if}
		</div>

		<div>
			<label class="block text-sm font-medium mb-1.5">
				{m.insurance_pension_contract_number()}
				<input
					type="text"
					bind:value={contractNumber}
					placeholder={m.insurance_pension_contract_number_placeholder()}
					class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
				/>
			</label>
		</div>
	</div>

	<!-- Start Date -->
	<div>
		<label class="block text-sm font-medium mb-1.5">
			{m.insurance_pension_start_date()}
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

	<!-- Notes -->
	<div>
		<label class="block text-sm font-medium mb-1.5">
			{m.insurance_pension_notes()}
			<textarea
				bind:value={notes}
				placeholder={m.insurance_pension_notes_placeholder()}
				rows="3"
				class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
			></textarea>
		</label>
	</div>
</div>
