<!--
@file src/lib/components/ui/ToastViewport.svelte
@kind component
@purpose Rendert die aktive Toast-Liste und koppelt deren Darstellung an den globalen Toast-Store.
-->

<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
	import { fly } from 'svelte/transition';
	import { browser } from '$app/environment';

	const reducedMotion = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const duration = reducedMotion ? 0 : 200;
	const exitDuration = reducedMotion ? 0 : 150;
</script>

<div
	class="fixed top-4 right-4 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2"
	role="status"
	aria-live="polite"
>
	{#each toastStore.items as toast (toast.id)}
		<div
			in:fly={{ x: 80, duration }}
			out:fly={{ x: 80, duration: exitDuration }}
			class="px-4 py-3 rounded-xl shadow-lg text-sm font-medium border {toast.type === 'success'
				? 'bg-card text-foreground border-primary/30'
				: 'bg-card text-destructive border-destructive/30'}"
		>
			{toast.message}
		</div>
	{/each}
</div>
