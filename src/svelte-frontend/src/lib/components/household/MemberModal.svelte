<script lang="ts">
	import type { HouseholdMember, HouseholdMemberFormData } from '$lib/types/household';
	import MemberForm from './MemberForm.svelte';

	let {
		open,
		member,
		onSubmit,
		onClose
	}: {
		open: boolean;
		member?: HouseholdMember;
		onSubmit: (data: HouseholdMemberFormData) => void;
		onClose: () => void;
	} = $props();

	let dialogEl: HTMLDialogElement;

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) dialogEl.showModal();
		else if (!open && dialogEl.open) dialogEl.close();
	});

	let title = $derived(member ? 'Edit Member' : 'New Member');
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	onclick={(e) => {
		if (e.target === dialogEl) onClose();
	}}
	onclose={onClose}
	class="rounded-xl p-0 w-full max-w-md shadow-xl border border-border"
>
	<div class="p-6">
		<h2 class="text-lg font-semibold mb-4">{title}</h2>
		{#if open}
			<MemberForm {member} onSubmit={onSubmit} onCancel={onClose} />
		{/if}
	</div>
</dialog>
