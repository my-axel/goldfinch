<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import PercentInput from '$lib/components/ui/PercentInput.svelte';

	let {
		name = $bindable(''),
		provider = $bindable(''),
		contractNumber = $bindable(''),
		startDate = $bindable(''),
		guaranteedInterest = $bindable(0),
		expectedReturn = $bindable(0),
		notes = $bindable(''),
		errors = {}
	}: {
		name: string;
		provider: string;
		contractNumber: string;
		startDate: string;
		guaranteedInterest: number;
		expectedReturn: number;
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

	<!-- Start Date, Guaranteed Interest, Expected Return -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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

		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="block text-sm font-medium mb-1.5">
				{m.insurance_pension_guaranteed_interest()}
			</label>
			<PercentInput bind:value={guaranteedInterest} max={0.50} decimals={2} />
		</div>

		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="block text-sm font-medium mb-1.5">
				{m.insurance_pension_expected_return()}
			</label>
			<PercentInput bind:value={expectedReturn} max={0.50} decimals={2} />
		</div>
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
