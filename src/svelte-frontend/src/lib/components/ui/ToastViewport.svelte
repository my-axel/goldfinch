<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
</script>

<div class="fixed top-4 right-4 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
	{#each toastStore.items as toast (toast.id)}
		<div
			class="px-4 py-3 rounded-xl shadow-lg text-sm font-medium border {toast.type === 'success'
				? 'bg-card text-foreground border-primary/30'
				: 'bg-card text-destructive border-destructive/30'}"
		>
			{toast.message}
		</div>
	{/each}
</div>
