<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		children
	}: {
		title?: string;
		children: Snippet;
	} = $props();
</script>

<div class="space-y-2 pl-4">
	{#if title}
		<h4 class="text-muted-foreground font-medium">{title}</h4>
	{/if}
	<div class="text-sm text-muted-foreground/80 space-y-2">
		{@render children()}
	</div>
</div>
