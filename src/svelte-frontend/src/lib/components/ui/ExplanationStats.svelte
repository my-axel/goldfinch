<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		columns = 1,
		children
	}: {
		columns?: 1 | 2 | 3;
		children: Snippet;
	} = $props();
</script>

<div
	class="w-full grid gap-2"
	style="grid-template-columns: repeat({columns}, minmax(0, 1fr))"
>
	{@render children()}
</div>
