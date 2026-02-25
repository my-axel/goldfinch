<!--
@file src/lib/components/dashboard/HouseholdSwitcher.svelte
@kind component
@purpose Pill-Switcher zum Wechseln zwischen Gesamthaushalt und einzelnen Haushaltsmitgliedern.
-->

<script lang="ts">
	import type { HouseholdMember } from '$lib/types/household';
	import { m } from '$lib/paraglide/messages.js';

	let {
		members,
		selectedMemberId = $bindable()
	}: {
		members: HouseholdMember[];
		selectedMemberId: number | undefined;
	} = $props();
</script>

<div class="flex flex-wrap gap-2">
	<button
		class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {selectedMemberId ===
		undefined
			? 'bg-primary text-primary-foreground'
			: 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'}"
		onclick={() => (selectedMemberId = undefined)}
	>
		{m.dashboard_filter_all()}
	</button>

	{#each members as member (member.id)}
		<button
			class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {selectedMemberId ===
			member.id
				? 'bg-primary text-primary-foreground'
				: 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'}"
			onclick={() => (selectedMemberId = member.id)}
		>
			{member.first_name}
		</button>
	{/each}
</div>
