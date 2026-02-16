<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		children
	}: {
		title?: string;
		description?: string;
		children: Snippet;
	} = $props();
</script>

<div class="bg-card rounded-xl border border-border shadow-sm p-6">
	{#if title}
		<h3 class="text-lg font-semibold">{title}</h3>
	{/if}
	{#if description}
		<p class="text-sm text-muted-foreground" class:mb-3={!!children}>{description}</p>
	{/if}
	{@render children()}
</div>
