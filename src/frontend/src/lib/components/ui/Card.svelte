<!--
@file src/lib/components/ui/Card.svelte
@kind component
@purpose Kapselt den UI-Abschnitt 'Card' im Bereich 'ui' mit Darstellung, Eingaben und Aktionen.
-->

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		headerActions,
		children
	}: {
		title?: string;
		description?: string;
		headerActions?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="bg-card rounded-xl border border-border shadow-sm p-6">
	{#if title || headerActions}
		<div class="flex justify-between items-start pb-6">
			<div class="space-y-1.5">
				{#if title}
					<h3 class="text-lg font-semibold">{title}</h3>
				{/if}
				{#if description}
					<p class="text-sm text-muted-foreground">{description}</p>
				{/if}
			</div>
			{#if headerActions}
				<div class="flex items-center space-x-2">
					{@render headerActions()}
				</div>
			{/if}
		</div>
	{:else if description}
		<p class="text-sm text-muted-foreground mb-3">{description}</p>
	{/if}
	{@render children()}
</div>
