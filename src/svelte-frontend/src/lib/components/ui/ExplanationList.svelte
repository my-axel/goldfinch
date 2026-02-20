<!--
@file src/lib/components/ui/ExplanationList.svelte
@kind component
@purpose Rendert den Hilfs- und Erklaerungsbaustein 'ExplanationList' fuer kontextbezogene Seitenerlaeuterungen.
-->

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children
	}: {
		children: Snippet;
	} = $props();
</script>

<ul class="space-y-2 text-sm text-muted-foreground/80 list-disc pl-4">
	{@render children()}
</ul>
