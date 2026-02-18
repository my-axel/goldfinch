<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import ExplanationStats from '$lib/components/ui/ExplanationStats.svelte';
	import ExplanationStat from '$lib/components/ui/ExplanationStat.svelte';
	import { parseIsoDateLocal } from '$lib/utils/date-only';

	let {
		locale,
		currency
	}: {
		locale: string;
		currency: string;
	} = $props();

	const previewNumber = 1234567.89;
	const previewDate = parseIsoDateLocal('2024-02-23') ?? new Date();

	let formattedNumber = $derived(
		new Intl.NumberFormat(locale).format(previewNumber)
	);

	let formattedCurrency = $derived(
		new Intl.NumberFormat(locale, { style: 'currency', currency }).format(previewNumber)
	);

	let formattedDate = $derived(
		new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
			previewDate
		)
	);
</script>

<ExplanationStats>
	<ExplanationStat label={m.preview_number()} subValue={formattedNumber} />
	<ExplanationStat label={m.preview_currency()} subValue={formattedCurrency} />
	<ExplanationStat label={m.preview_date()} subValue={formattedDate} />
</ExplanationStats>
