<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		aside
	}: {
		children: Snippet;
		aside?: Snippet;
	} = $props();
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
	<div class="lg:col-span-8">
		{@render children()}
	</div>
	{#if aside}
		<div class="lg:col-span-4">
			{@render aside()}
		</div>
	{/if}
</div>
