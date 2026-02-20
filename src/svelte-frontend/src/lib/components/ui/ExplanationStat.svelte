<!--
@file src/lib/components/ui/ExplanationStat.svelte
@kind component
@purpose Rendert den Hilfs- und Erklaerungsbaustein 'ExplanationStat' fuer kontextbezogene Seitenerlaeuterungen.
-->

<script lang="ts">
	import type { Component } from 'svelte';

	let {
		icon,
		label,
		value,
		subValue,
		subLabel,
		tooltip
	}: {
		icon?: Component<{ class?: string }>;
		label: string;
		value?: string | number;
		subValue?: string | number;
		subLabel?: string;
		tooltip?: string;
	} = $props();
</script>

<div class="flex items-start gap-3">
	{#if icon}
		{@const Icon = icon}
		<div class="p-1 bg-primary/10 rounded-full mt-0.5">
			<Icon class="h-4 w-4 text-primary" />
		</div>
	{/if}
	<div class="flex-1 min-w-0 space-y-1">
		<p class="text-sm font-medium text-muted-foreground">{label}</p>
		<div class="space-y-0.5">
			{#if value !== undefined}
				<p class="text-base font-bold leading-none opacity-80">{value}</p>
			{/if}
			{#if subValue || subLabel}
				<div class="flex items-baseline gap-1.5">
					{#if subValue}
						<p
							class="text-xs font-medium leading-none opacity-80 cursor-default"
							title={tooltip}
						>
							{subValue}
						</p>
					{/if}
					{#if subLabel}
						<span class="text-xs text-muted-foreground">{subLabel}</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
