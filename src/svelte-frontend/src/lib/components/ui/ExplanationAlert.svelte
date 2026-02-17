<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Info } from '@lucide/svelte';

	let {
		children
	}: {
		children: Snippet;
	} = $props();
</script>

<div class="flex gap-3 rounded-lg border border-border bg-muted p-3">
	<Info class="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
	<div class="text-sm text-muted-foreground/90">
		{@render children()}
	</div>
</div>
