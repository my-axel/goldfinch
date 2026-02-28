<!--
@file src/lib/components/pension/etf/BasicInformationCard.svelte
@kind component
@purpose Kapselt den UI-Abschnitt 'BasicInformationCard' im Bereich 'pension' mit Darstellung, Eingaben und Aktionen.
@contains Kernfunktionen `handleETFSelect()` steuern Eingaben, Validierung und Benutzeraktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import ETFSearchInput from './ETFSearchInput.svelte';

	let {
		name = $bindable(''),
		etfId = $bindable(''),
		etfDisplayName = $bindable(''),
		notes = $bindable(''),
		isEditing = false,
		errors = {}
	}: {
		name: string;
		etfId: string;
		etfDisplayName: string;
		notes: string;
		isEditing?: boolean;
		errors?: Record<string, string>;
	} = $props();

	function handleETFSelect(id: string, etfName: string, symbol: string) {
		etfId = id;
		etfDisplayName = `${symbol} - ${etfName}`;
	}
</script>

<div class="space-y-6">
	<div class="grid grid-cols-[1fr_2fr] gap-6">
		<!-- Name -->
		<div class="space-y-1">
			<label for="etf-name" class="text-sm font-medium">
				{m.etf_pension_name()}
			</label>
			<input
				id="etf-name"
				type="text"
				bind:value={name}
				placeholder="My ETF Investment"
				class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring {errors.name ? 'border-destructive' : ''}"
			/>
			{#if errors.name}
				<p class="text-xs text-destructive">{errors.name}</p>
			{/if}
		</div>

		<!-- ETF selection -->
		<div class="space-y-1">
			<p class="text-sm font-medium">{m.etf_pension_etf()}</p>
			<ETFSearchInput
				value={etfId}
				displayName={etfDisplayName}
				readOnly={isEditing}
				onSelect={handleETFSelect}
			/>
			{#if errors.etf_id}
				<p class="text-xs text-destructive">{errors.etf_id}</p>
			{/if}
		</div>
	</div>

	<!-- Notes -->
	<div class="space-y-1">
		<label for="etf-notes" class="text-sm font-medium">{m.etf_pension_notes()}</label>
		<textarea
			id="etf-notes"
			bind:value={notes}
			placeholder={m.etf_pension_notes_placeholder()}
			rows="3"
			class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
		></textarea>
	</div>
</div>
