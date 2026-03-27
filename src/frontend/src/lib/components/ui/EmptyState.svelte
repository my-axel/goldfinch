<!--
@file src/lib/components/ui/EmptyState.svelte
@kind component
@purpose Einheitlicher Leerzustand mit optionalem Icon, Titel, Beschreibung und Aktion.
-->

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		icon: Icon,
		title,
		description,
		action,
		compact = false
	}: {
		icon?: any;
		title: string;
		description?: string;
		action?: Snippet;
		compact?: boolean;
	} = $props();
</script>

<div class="flex flex-col items-center text-center" class:py-6={compact} class:py-10={!compact}>
	{#if Icon}
		<div class="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
			<Icon class="h-5 w-5" />
		</div>
	{/if}
	<p class="text-sm font-medium">{title}</p>
	{#if description}
		<p class="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
	{/if}
	{#if action}
		<div class="mt-3">
			{@render action()}
		</div>
	{/if}
</div>
