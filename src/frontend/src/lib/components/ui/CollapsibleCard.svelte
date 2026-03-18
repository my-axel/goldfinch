<!--
@file src/lib/components/ui/CollapsibleCard.svelte
@kind component
@purpose Card that collapses to show a compact summary, expands to reveal full content.
-->

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import { ChevronDown } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';

	let {
		title,
		description,
		collapsed = $bindable(false),
		summary,
		children
	}: {
		title: string;
		description?: string;
		collapsed: boolean;
		summary?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="bg-card rounded-xl border border-border shadow-sm">
	<!-- Header (always visible) -->
	<button
		type="button"
		class="w-full flex items-start justify-between p-6 text-left cursor-pointer"
		class:pb-0={!collapsed}
		onclick={() => (collapsed = !collapsed)}
	>
		<div class="space-y-1.5">
			<h3 class="text-lg font-semibold">{title}</h3>
			{#if description && !collapsed}
				<p class="text-sm text-muted-foreground">{description}</p>
			{/if}
		</div>
		<div class="flex items-center gap-2 mt-0.5 shrink-0">
			<span class="text-xs font-medium text-muted-foreground">
				{collapsed ? m.plan_config_edit_button() : m.plan_config_collapse_button()}
			</span>
			<ChevronDown
				class="h-4 w-4 text-muted-foreground transition-transform duration-200 {collapsed
					? ''
					: 'rotate-180'}"
			/>
		</div>
	</button>

	<!-- Collapsed: summary -->
	{#if collapsed && summary}
		<div class="px-6 pb-5 pt-2">
			{@render summary()}
		</div>
	{/if}

	<!-- Expanded: full content -->
	{#if !collapsed}
		<div class="p-6 pt-4" transition:slide={{ duration: 200 }}>
			{@render children()}
		</div>
	{/if}
</div>
