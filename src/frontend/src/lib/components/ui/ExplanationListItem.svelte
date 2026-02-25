<!--
@file src/lib/components/ui/ExplanationListItem.svelte
@kind component
@purpose Rendert den Hilfs- und Erklaerungsbaustein 'ExplanationListItem' fuer kontextbezogene Seitenerlaeuterungen.
-->

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
