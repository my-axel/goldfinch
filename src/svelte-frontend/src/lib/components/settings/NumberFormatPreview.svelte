<script lang="ts">
	let {
		locale,
		currency
	}: {
		locale: string;
		currency: string;
	} = $props();

	const previewNumber = 1234567.89;
	const previewDate = new Date('2024-02-23');

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

<div class="space-y-3">
	<div>
		<p class="text-xs font-medium text-muted-foreground">Number</p>
		<p class="text-sm font-bold text-muted-foreground/80">{formattedNumber}</p>
	</div>
	<div>
		<p class="text-xs font-medium text-muted-foreground">Currency</p>
		<p class="text-sm font-bold text-muted-foreground/80">{formattedCurrency}</p>
	</div>
	<div>
		<p class="text-xs font-medium text-muted-foreground">Date</p>
		<p class="text-sm font-bold text-muted-foreground/80">{formattedDate}</p>
	</div>
</div>
