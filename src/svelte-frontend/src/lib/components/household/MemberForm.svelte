<script lang="ts">
	import type {
		HouseholdMember,
		HouseholdMemberFormData,
		ValidationErrors
	} from '$lib/types/household';
	import { validateMemberForm } from '$lib/types/household';

	let {
		member,
		onSubmit,
		onCancel
	}: {
		member?: HouseholdMember;
		onSubmit: (data: HouseholdMemberFormData) => void;
		onCancel: () => void;
	} = $props();

	let first_name = $state('');
	let last_name = $state('');
	let birthday = $state('');
	let retirement_age_planned = $state(67);
	let retirement_age_possible = $state(63);

	let errors = $state<ValidationErrors>({});
	let submitted = $state(false);

	// Reset form when member prop changes (edit mode)
	$effect(() => {
		if (member) {
			first_name = member.first_name;
			last_name = member.last_name;
			birthday = member.birthday;
			retirement_age_planned = member.retirement_age_planned;
			retirement_age_possible = member.retirement_age_possible;
		} else {
			first_name = '';
			last_name = '';
			birthday = '';
			retirement_age_planned = 67;
			retirement_age_possible = 63;
		}
		errors = {};
		submitted = false;
	});

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;

		const data: HouseholdMemberFormData = {
			first_name: first_name.trim(),
			last_name: last_name.trim(),
			birthday,
			retirement_age_planned: Number(retirement_age_planned),
			retirement_age_possible: Number(retirement_age_possible)
		};

		const validationErrors = validateMemberForm(data);
		errors = validationErrors;

		if (Object.keys(validationErrors).length === 0) {
			onSubmit(data);
		}
	}

	const inputClass =
		'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors';
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="first_name" class="block text-sm font-medium text-foreground/80 mb-1">Vorname</label>
			<input id="first_name" type="text" bind:value={first_name} class={inputClass} />
			{#if submitted && errors.first_name}
				<p class="text-sm text-destructive mt-1">{errors.first_name}</p>
			{/if}
		</div>
		<div>
			<label for="last_name" class="block text-sm font-medium text-foreground/80 mb-1">Nachname</label>
			<input id="last_name" type="text" bind:value={last_name} class={inputClass} />
			{#if submitted && errors.last_name}
				<p class="text-sm text-destructive mt-1">{errors.last_name}</p>
			{/if}
		</div>
	</div>

	<div>
		<label for="birthday" class="block text-sm font-medium text-foreground/80 mb-1">Geburtstag</label>
		<input id="birthday" type="date" bind:value={birthday} class={inputClass} />
		{#if submitted && errors.birthday}
			<p class="text-sm text-destructive mt-1">{errors.birthday}</p>
		{/if}
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="retirement_planned" class="block text-sm font-medium text-foreground/80 mb-1"
				>Geplantes Rentenalter</label
			>
			<input
				id="retirement_planned"
				type="number"
				min="40"
				max="100"
				bind:value={retirement_age_planned}
				class={inputClass}
			/>
			{#if submitted && errors.retirement_age_planned}
				<p class="text-sm text-destructive mt-1">{errors.retirement_age_planned}</p>
			{/if}
		</div>
		<div>
			<label for="retirement_possible" class="block text-sm font-medium text-foreground/80 mb-1"
				>Frühestes Rentenalter</label
			>
			<input
				id="retirement_possible"
				type="number"
				min="40"
				max="100"
				bind:value={retirement_age_possible}
				class={inputClass}
			/>
			{#if submitted && errors.retirement_age_possible}
				<p class="text-sm text-destructive mt-1">{errors.retirement_age_possible}</p>
			{/if}
		</div>
	</div>

	<div class="flex justify-end gap-2 pt-2">
		<button
			type="button"
			onclick={onCancel}
			class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
		>
			Abbrechen
		</button>
		<button
			type="submit"
			class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
		>
			{member ? 'Speichern' : 'Hinzufügen'}
		</button>
	</div>
</form>
