<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import ETFSearchInput from './ETFSearchInput.svelte';
	import NumberInput from '$lib/components/ui/NumberInput.svelte';

	let {
		name = $bindable(''),
		etfId = $bindable(''),
		etfDisplayName = $bindable(''),
		existingUnits = $bindable(0),
		referenceDate = $bindable(''),
		notes = $bindable(''),
		isExistingInvestment = false,
		isEditing = false,
		errors = {}
	}: {
		name: string;
		etfId: string;
		etfDisplayName: string;
		existingUnits: number;
		referenceDate: string;
		notes: string;
		isExistingInvestment?: boolean;
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

		<!-- Existing units + reference date (only for "existing" init method) -->
		{#if isExistingInvestment}
			<div class="space-y-1">
				<label for="existing-units" class="text-sm font-medium">
					{m.etf_pension_current_units()}
				</label>
				<NumberInput bind:value={existingUnits} decimals={6} placeholder="0.000000" min={0} />
			</div>

			<div class="space-y-1">
				<label for="reference-date" class="text-sm font-medium">
					{m.etf_pension_reference_date()}
				</label>
				<input
					id="reference-date"
					type="date"
					bind:value={referenceDate}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm h-9 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
		{/if}
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
