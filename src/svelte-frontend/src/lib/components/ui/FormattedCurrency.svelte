<!--
@file src/lib/components/ui/FormattedCurrency.svelte
@kind component
@purpose Rendert formatierte Werte im Baustein 'FormattedCurrency' auf Basis der aktiven Locale- und Waehrungseinstellungen.
-->

<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { formatCurrency } from '$lib/utils/format';

	let { value, decimals = 2, class: className = '' }: { value: number; decimals?: number; class?: string } = $props();

	let formatted = $derived(
		formatCurrency(value, settingsStore.current.number_locale, settingsStore.current.currency, decimals)
	);
</script>

<span class={className}>{formatted}</span>
