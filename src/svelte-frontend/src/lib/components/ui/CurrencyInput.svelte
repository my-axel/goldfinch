<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getCurrencySymbol, getCurrencyPosition } from '$lib/utils/format';
	import NumberInput from './NumberInput.svelte';

	let {
		value = $bindable(0),
		decimals = 2,
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

	let symbol = $derived(getCurrencySymbol(settingsStore.current.number_locale, settingsStore.current.currency));
	let position = $derived(getCurrencyPosition(settingsStore.current.number_locale));
</script>

{#if showSymbol}
	<div class="relative {className}">
		{#if position === 'prefix'}
			<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
		{/if}
		<NumberInput
			bind:value
			{decimals}
			{min}
			{max}
			{disabled}
			class={position === 'prefix' ? 'pl-7' : 'pr-7'}
		/>
		{#if position === 'suffix'}
			<span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
		{/if}
	</div>
{:else}
	<NumberInput bind:value {decimals} {min} {max} {disabled} class={className} />
{/if}
