<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let {
		open,
		memberName,
		onConfirm,
		onCancel
	}: {
		open: boolean;
		memberName: string;
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();

	let dialogEl: HTMLDialogElement;

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) dialogEl.showModal();
		else if (!open && dialogEl.open) dialogEl.close();
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	onclick={(e) => {
		if (e.target === dialogEl) onCancel();
	}}
	onclose={onCancel}
	class="rounded-xl p-0 max-w-sm shadow-xl border border-border"
>
	<div class="p-6">
		<h2 class="text-lg font-semibold">{m.household_delete_member()}</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			{m.household_delete_confirm_before()} <strong class="text-foreground">{memberName}</strong>{m.household_delete_confirm_after()}
		</p>
		<div class="mt-4 flex justify-end gap-2">
			<button
				onclick={onCancel}
				class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.household_cancel()}
			</button>
			<button
				onclick={onConfirm}
				class="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{m.household_delete()}
			</button>
		</div>
	</div>
</dialog>
