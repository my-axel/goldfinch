<!--
@file src/lib/components/ui/FormattedPercent.svelte
@kind component
@purpose Rendert formatierte Werte im Baustein 'FormattedPercent' auf Basis der aktiven Locale- und Waehrungseinstellungen.
-->

<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { formatPercent } from '$lib/utils/format';

	let {
		value,
		decimals = 1,
		class: className = ''
	}: {
		value: number;
		decimals?: number;
		class?: string;
	} = $props();

	let formatted = $derived(formatPercent(value, settingsStore.current.number_locale, decimals));
</script>

<span class={className}>{formatted}</span>
