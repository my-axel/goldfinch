<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { formatDate } from '$lib/utils/format';

	let {
		value,
		format,
		class: className = ''
	}: {
		value: string | Date;
		format?: Intl.DateTimeFormatOptions;
		class?: string;
	} = $props();

	let formatted = $derived(formatDate(value, settingsStore.current.ui_locale, format));
</script>

<span class={className}>{formatted}</span>
