<!--
@file src/lib/components/ui/StepperInput.svelte
@kind component
@purpose Generic numeric stepper with − and + buttons flanking a locale-aware number input.
@contains Locale-aware number input with increment/decrement buttons, min/max clamping, and size variants.
-->

<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getDecimalSeparator, parseNumber, formatNumberInput } from '$lib/utils/format';

	let {
		value = $bindable(0),
		step = 1,
		min,
		max,
		decimals = 0,
		size = 'md',
		disabled = false,
		class: className = ''
	}: {
		value: number;
		step?: number;
		min?: number;
		max?: number;
		decimals?: number;
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

	let atMin = $derived(min !== undefined && value <= min);
	let atMax = $derived(max !== undefined && value >= max);

	// Sync display when value changes externally (not while user is typing)
	$effect(() => {
		if (!focused) {
			inputText = formatNumberInput(value, locale, decimals);
		}
	});

	function handleInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		const regex = new RegExp(`^-?\\d*[${decSep}]?\\d*$`);
		if (!regex.test(raw) && raw !== '') return;
		inputText = raw;
		const parsed = parseNumber(raw, locale);
		if (!isNaN(parsed)) {
			value = parsed;
		}
	}

	function handleFocus() {
		focused = true;
		requestAnimationFrame(() => inputEl?.select());
	}

	function handleBlur() {
		focused = false;
		if (min !== undefined && value < min) value = min;
		if (max !== undefined && value > max) value = max;
		inputText = formatNumberInput(value, locale, decimals);
	}

	function roundTo(n: number): number {
		const factor = 10 ** decimals;
		return Math.round(n * factor) / factor;
	}

	function decrement() {
		const next = roundTo(value - step);
		value = min !== undefined ? Math.max(min, next) : next;
		inputText = formatNumberInput(value, locale, decimals);
	}

	function increment() {
		const next = roundTo(value + step);
		value = max !== undefined ? Math.min(max, next) : next;
		inputText = formatNumberInput(value, locale, decimals);
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
	<input
		bind:this={inputEl}
		type="text"
		inputmode="decimal"
		value={inputText}
		oninput={handleInput}
		onfocus={handleFocus}
		onblur={handleBlur}
		{disabled}
		class="flex-1 min-w-0 bg-background text-center {textSize[size]} {inputPadding[size]} focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
	/>
	<button
		type="button"
		onclick={increment}
		disabled={disabled || atMax}
		class="flex shrink-0 items-center justify-center border-l border-border bg-background {btnPadding[size]} {textSize[size]} font-medium leading-none transition-colors hover:bg-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
	>
		+
	</button>
</div>
