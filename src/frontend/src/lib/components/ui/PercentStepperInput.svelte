<!--
@file src/lib/components/ui/PercentStepperInput.svelte
@kind component
@purpose Percent-aware stepper with − and + buttons. Stores value as decimal (0.05 = 5%), displays as percentage (5.0 %).
@contains Decimal↔percentage conversion, locale-aware formatting, step-based increment/decrement.
-->

<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getDecimalSeparator, parseNumber, formatNumberInput, removeGroupingSeparators } from '$lib/utils/format';

	let {
		value = $bindable(0),
		step = 0.1,
		min,
		max,
		decimals = 1,
		showSymbol = true,
		size = 'md',
		disabled = false,
		class: className = ''
	}: {
		value: number;
		step?: number;
		min?: number;
		max?: number;
		decimals?: number;
		showSymbol?: boolean;
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		class?: string;
	} = $props();

	const btnPadding = { sm: 'px-2.5 py-1', md: 'px-3 py-2', lg: 'px-4 py-2.5' };
	const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };
	const inputPadding = { sm: 'px-2 py-1', md: 'px-2 py-2', lg: 'px-3 py-2.5' };

	let locale = $derived(settingsStore.current.number_locale);
	let decSep = $derived(getDecimalSeparator(locale));
	let inputEl: HTMLInputElement | undefined = $state();
	let inputText = $state('');
	let focused = $state(false);

	// value is in decimal (0.05), display as percentage (5.0)
	let atMin = $derived(min !== undefined && value <= min);
	let atMax = $derived(max !== undefined && value >= max);

	// Sync display when value changes externally (not while user is typing)
	$effect(() => {
		if (!focused) {
			inputText = formatNumberInput(value * 100, locale, decimals, true);
		}
	});

	function handleInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const regex = new RegExp(`^-?\\d*[${decSep}]?\\d*$`);
		if (!regex.test(raw) && raw !== '') return;
		inputText = raw;
		const parsed = parseNumber(raw, locale);
		if (!isNaN(parsed)) {
			value = parsed / 100;
		}
	}

	function handleFocus() {
		focused = true;
		inputText = removeGroupingSeparators(inputText, locale);
		requestAnimationFrame(() => inputEl?.select());
	}

	function handleBlur() {
		focused = false;
		if (min !== undefined && value < min) value = min;
		if (max !== undefined && value > max) value = max;
		inputText = formatNumberInput(value * 100, locale, decimals, true);
	}

	function roundTo(n: number): number {
		const factor = 10 ** decimals;
		return Math.round(n * factor) / factor;
	}

	function decrement() {
		// step and min/max are in display units (percentage)
		const currentDisplay = roundTo(value * 100);
		const next = roundTo(currentDisplay - step);
		const minDisplay = min !== undefined ? min * 100 : undefined;
		const newDisplay = minDisplay !== undefined ? Math.max(minDisplay, next) : next;
		value = newDisplay / 100;
		inputText = formatNumberInput(newDisplay, locale, decimals, true);
	}

	function increment() {
		const currentDisplay = roundTo(value * 100);
		const next = roundTo(currentDisplay + step);
		const maxDisplay = max !== undefined ? max * 100 : undefined;
		const newDisplay = maxDisplay !== undefined ? Math.min(maxDisplay, next) : next;
		value = newDisplay / 100;
		inputText = formatNumberInput(newDisplay, locale, decimals, true);
	}
</script>

<div
	class="flex items-stretch w-full overflow-hidden rounded-lg border border-border focus-within:ring-2 focus-within:ring-ring transition-colors {className}"
>
	<button
		type="button"
		onclick={decrement}
		disabled={disabled || atMin}
		class="flex shrink-0 items-center justify-center border-r border-border bg-background {btnPadding[size]} {textSize[size]} font-medium leading-none transition-colors hover:bg-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
	>
		−
	</button>
	<div class="relative flex-1 min-w-0">
		<input
			bind:this={inputEl}
			type="text"
			inputmode="decimal"
			value={inputText}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			{disabled}
			class="w-full bg-background text-center {textSize[size]} {inputPadding[size]} {showSymbol
				? 'pr-7'
				: ''} focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		/>
		{#if showSymbol}
			<span
				class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 {textSize[size]} text-muted-foreground"
				>%</span
			>
		{/if}
	</div>
	<button
		type="button"
		onclick={increment}
		disabled={disabled || atMax}
		class="flex shrink-0 items-center justify-center border-l border-border bg-background {btnPadding[size]} {textSize[size]} font-medium leading-none transition-colors hover:bg-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
	>
		+
	</button>
</div>
