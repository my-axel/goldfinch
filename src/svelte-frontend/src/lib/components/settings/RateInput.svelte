<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';

	let {
		value,
		onChange,
		disabled = false
	}: {
		value: number;
		onChange: (value: number) => void;
		disabled?: boolean;
	} = $props();

	let displayValue = $state('');
	let inputEl = $state<HTMLInputElement>();

	// Format a number according to the user's locale (e.g. 2.0 → "2,0" for de-DE)
	function formatForLocale(n: number): string {
		return n.toLocaleString(settingsStore.current.number_locale, {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1
		});
	}

	// Parse a locale-formatted string back to a number (handles both "2.0" and "2,0")
	function parseLocaleNumber(str: string): number {
		// Replace locale decimal separator with dot for parseFloat
		const normalized = str.replace(',', '.');
		return parseFloat(normalized);
	}

	// Sync from parent when value changes externally (e.g. after API response, or initial load)
	$effect(() => {
		const formatted = formatForLocale(value);
		if (!inputEl || document.activeElement !== inputEl) {
			displayValue = formatted;
		}
	});

	function handleInput(e: Event) {
		displayValue = (e.target as HTMLInputElement).value;
	}

	function commit() {
		const parsed = parseLocaleNumber(displayValue);
		if (!isNaN(parsed)) {
			const clamped = Math.min(15, Math.max(0, Math.round(parsed * 10) / 10));
			onChange(clamped);
			displayValue = formatForLocale(clamped);
		} else {
			// Revert to current value
			displayValue = formatForLocale(value);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			inputEl?.blur();
			return;
		}

		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			const current = parseLocaleNumber(displayValue);
			if (isNaN(current)) return;
			const step = e.key === 'ArrowUp' ? 0.1 : -0.1;
			const next = Math.min(15, Math.max(0, Math.round((current + step) * 10) / 10));
			displayValue = formatForLocale(next);
			onChange(next);
		}
	}
</script>

<div class="relative inline-block">
	<input
		bind:this={inputEl}
		type="text"
		inputmode="decimal"
		value={displayValue}
		oninput={handleInput}
		onblur={commit}
		onkeydown={handleKeydown}
		{disabled}
		class="w-24 rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-right
			focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
	/>
	<span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
</div>
