<script lang="ts">
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
		<h2 class="text-lg font-semibold">Delete Member</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Are you sure you want to delete <strong class="text-foreground">{memberName}</strong>? This
			action cannot be undone.
		</p>
		<div class="mt-4 flex justify-end gap-2">
			<button
				onclick={onCancel}
				class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				Cancel
			</button>
			<button
				onclick={onConfirm}
				class="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm font-medium transition-colors"
			>
				Delete
			</button>
		</div>
	</div>
</dialog>
