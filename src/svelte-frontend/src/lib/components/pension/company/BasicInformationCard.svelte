<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { ContributionFrequency } from '$lib/types/pension';
	import CurrencyInput from '$lib/components/ui/CurrencyInput.svelte';

	let {
		name = $bindable(''),
		employer = $bindable(''),
		startDate = $bindable(''),
		contributionAmount = $bindable(0),
		contributionFrequency = $bindable<ContributionFrequency | undefined>(undefined),
		notes = $bindable(''),
		errors = {}
	}: {
		name: string;
		employer: string;
		startDate: string;
		contributionAmount: number;
		contributionFrequency: ContributionFrequency | undefined;
		notes: string;
		errors?: { name?: string; start_date?: string; employer?: string };
	} = $props();

	const frequencyOptions: { value: ContributionFrequency; label: () => string }[] = [
		{ value: ContributionFrequency.MONTHLY, label: () => m.pension_per_month() },
		{ value: ContributionFrequency.QUARTERLY, label: () => m.pension_per_quarter() },
		{ value: ContributionFrequency.SEMI_ANNUALLY, label: () => m.pension_per_half_year() },
		{ value: ContributionFrequency.ANNUALLY, label: () => m.pension_per_year() },
		{ value: ContributionFrequency.ONE_TIME, label: () => m.pension_one_time() }
	];
</script>

<div class="space-y-6">
	<!-- Name -->
	<div>
		<label class="block text-sm font-medium mb-1.5">
			{m.company_pension_name()}
			<input
				type="text"
				bind:value={name}
				placeholder={m.company_pension_name_placeholder()}
				class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
					{errors.name ? 'border-destructive' : ''}"
			/>
		</label>
		{#if errors.name}
			<p class="text-xs text-destructive mt-1">{errors.name}</p>
		{/if}
	</div>

	<!-- Employer and Start Date -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div>
			<label class="block text-sm font-medium mb-1.5">
				{m.company_pension_employer()}
				<input
					type="text"
					bind:value={employer}
					placeholder={m.company_pension_employer_placeholder()}
					class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
						{errors.employer ? 'border-destructive' : ''}"
				/>
			</label>
			{#if errors.employer}
				<p class="text-xs text-destructive mt-1">{errors.employer}</p>
			{/if}
		</div>

		<div>
			<label class="block text-sm font-medium mb-1.5">
				{m.company_pension_start_date()}
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
	</div>

	<!-- Contribution Amount and Frequency -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div>
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<label class="block text-sm font-medium mb-1.5">
				{m.company_pension_contribution_amount()}
			</label>
			<CurrencyInput bind:value={contributionAmount} min={0} />
		</div>

		<div>
			<label class="block text-sm font-medium mb-1.5">
				{m.company_pension_contribution_frequency()}
				<select
					bind:value={contributionFrequency}
					class="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
				>
					<option value={undefined}>—</option>
					{#each frequencyOptions as opt}
						<option value={opt.value}>{opt.label()}</option>
					{/each}
				</select>
			</label>
		</div>
	</div>

	<!-- Notes -->
	<div>
		<label class="block text-sm font-medium mb-1.5">
			{m.company_pension_notes()}
			<textarea
				bind:value={notes}
				placeholder={m.company_pension_notes_placeholder()}
				rows="3"
				class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
			></textarea>
		</label>
	</div>
</div>
