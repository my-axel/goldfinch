<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let {
		open,
		itemName,
		title = m.delete_confirm_title(),
		descriptionBefore = m.delete_confirm_before(),
		descriptionAfter = m.delete_confirm_after(),
		cancelLabel = m.cancel(),
		confirmLabel = m.delete_action(),
		onConfirm,
		onCancel
	}: {
		open: boolean;
		itemName: string;
		title?: string;
		descriptionBefore?: string;
		descriptionAfter?: string;
		cancelLabel?: string;
		confirmLabel?: string;
		onConfirm: () => void | Promise<void>;
		onCancel: () => void;
	} = $props();

	let dialogEl: HTMLDialogElement;
	let submitting = $state(false);

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) dialogEl.showModal();
			else if (!open && dialogEl.open) dialogEl.close();
	});

	async function handleConfirm() {
		submitting = true;
		try {
			await onConfirm();
		} finally {
			submitting = false;
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	onclick={(e) => { if (e.target === dialogEl) onCancel(); }}
	onclose={onCancel}
	class="rounded-xl p-0 max-w-sm shadow-xl border border-border"
>
	<div class="p-6">
		<h2 class="text-lg font-semibold">{title}</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			{descriptionBefore} <strong class="text-foreground">{itemName}</strong>{descriptionAfter}
		</p>
		<div class="mt-4 flex justify-end gap-2">
			<button
				type="button"
				onclick={onCancel}
				disabled={submitting}
				class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{cancelLabel}
			</button>
			<button
				type="button"
				onclick={handleConfirm}
				disabled={submitting}
				class="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm font-medium transition-colors"
			>
				{confirmLabel}
			</button>
		</div>
	</div>
</dialog>
