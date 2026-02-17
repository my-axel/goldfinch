<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children
	}: {
		children: Snippet;
	} = $props();
</script>

<li class="text-muted-foreground/80">
	{@render children()}
</li>
