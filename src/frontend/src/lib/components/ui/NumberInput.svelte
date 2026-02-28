<!--
@file src/lib/components/ui/NumberInput.svelte
@kind component
@purpose Kapselt den Eingabebaustein 'NumberInput' im Bereich 'ui' mit Formatierungs- und Interaktionslogik.
@contains Lokaler Komponentenstatus und abgeleitete Werte werden reaktiv im Script-Block verwaltet.
@contains Kernfunktionen `handleInput()`, `handleFocus()`, `handleBlur()` steuern Eingaben, Validierung und Benutzeraktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getDecimalSeparator, parseNumber, formatNumberInput, removeGroupingSeparators } from '$lib/utils/format';

	let {
		value = $bindable(0),
		decimals = 2,
		min,
		max,
		placeholder = '',
		disabled = false,
		class: className = ''
	}: {
		value: number;
		decimals?: number;
		min?: number;
		max?: number;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
	} = $props();

	let locale = $derived(settingsStore.current.number_locale);
	let decSep = $derived(getDecimalSeparator(locale));
	let inputEl: HTMLInputElement;
	let displayValue = $state('');
	let focused = $state(false);

	// Sync display when value changes externally (not while user is typing)
	$effect(() => {
		if (!focused) {
			displayValue = formatNumberInput(value, locale, decimals, true);
		}
	});

	function handleInput(e: Event) {
		const raw = (e.target as HTMLInputElement).value;
		// Allow digits, decimal separator, minus
		const regex = new RegExp(`^-?\\d*[${decSep}]?\\d*$`);
		if (!regex.test(raw) && raw !== '') return;
		displayValue = raw;
		value = parseNumber(raw, locale);
	}

	function handleFocus() {
		focused = true;
		displayValue = removeGroupingSeparators(displayValue, locale);
		// Select all on focus for easy replacement
		requestAnimationFrame(() => inputEl?.select());
	}

	function handleBlur() {
		focused = false;
		// Clamp to min/max
		if (min !== undefined && value < min) value = min;
		if (max !== undefined && value > max) value = max;
		displayValue = formatNumberInput(value, locale, decimals, true);
	}
</script>

<input
	bind:this={inputEl}
	type="text"
	inputmode="decimal"
	value={displayValue}
	oninput={handleInput}
	onfocus={handleFocus}
	onblur={handleBlur}
	{placeholder}
	{disabled}
	class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring {className}"
/>
