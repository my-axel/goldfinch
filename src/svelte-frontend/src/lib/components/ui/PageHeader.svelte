<!--
@file src/lib/components/ui/PageHeader.svelte
@kind component
@purpose Rendert einen einheitlichen Seitenkopf mit Titel und optionaler Beschreibung.
-->

<script lang="ts">
	let {
		title,
		description
	}: {
		title: string;
		description: string;
	} = $props();
</script>

<div class="mb-8">
	<h1 class="text-3xl font-bold tracking-tight">{title}</h1>
	<p class="text-muted-foreground mt-2">{description}</p>
</div>
