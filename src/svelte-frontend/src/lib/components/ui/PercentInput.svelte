<!--
@file src/lib/components/ui/PercentInput.svelte
@kind component
@purpose Kapselt den Eingabebaustein 'PercentInput' im Bereich 'ui' mit Formatierungs- und Interaktionslogik.
@contains Lokaler Komponentenstatus und abgeleitete Werte werden reaktiv im Script-Block verwaltet.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { untrack } from 'svelte';
	import NumberInput from './NumberInput.svelte';

	let {
		value = $bindable(0),
		decimals = 1,
		min,
		max,
		showSymbol = true,
		disabled = false,
		class: className = ''
	}: {
		value: number;
		decimals?: number;
		min?: number;
		max?: number;
		showSymbol?: boolean;
		disabled?: boolean;
		class?: string;
	} = $props();

	// Display as percentage (5) but store as decimal (0.05)
	let displayValue = $state(value * 100);

	// Sync inward: external value → display
	// untrack(displayValue) so this effect only re-runs when value/decimals change,
	// not when the user types (which would reset the display to the old value)
	$effect(() => {
		const rounded = Math.round(value * 100 * 10 ** decimals) / 10 ** decimals;
		if (Math.abs(rounded - untrack(() => displayValue)) > 0.0001) {
			displayValue = rounded;
		}
	});

	// Sync outward: display → external value
	$effect(() => {
		const newValue = displayValue / 100;
		if (Math.abs(newValue - value) > 0.000001) {
			value = newValue;
		}
	});
</script>

{#if showSymbol}
	<div class="relative {className}">
		<NumberInput
			bind:value={displayValue}
			{decimals}
			min={min !== undefined ? min * 100 : undefined}
			max={max !== undefined ? max * 100 : undefined}
			{disabled}
			class="pr-7"
		/>
		<span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
	</div>
{:else}
	<NumberInput
		bind:value={displayValue}
		{decimals}
		min={min !== undefined ? min * 100 : undefined}
		max={max !== undefined ? max * 100 : undefined}
		{disabled}
		class={className}
	/>
{/if}
