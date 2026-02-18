<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { formatCurrency, formatDate } from '$lib/utils/format';
	import { compareIsoDate } from '$lib/utils/date-only';
	import type { ExtraContribution } from '$lib/types/pension';

	let {
		contributions
	}: {
		contributions: ExtraContribution[];
	} = $props();

	let sorted = $derived(
		[...contributions].sort((a, b) => compareIsoDate(b.contribution_date, a.contribution_date))
	);
</script>

<div>
	<h3 class="text-lg font-medium mb-4">{m.contribution_history_title()}</h3>

	<div class="border border-border rounded-lg overflow-hidden">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border bg-muted/50">
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">{m.contribution_history_date()}</th>
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">{m.contribution_amount()}</th>
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">{m.contribution_history_note()}</th>
				</tr>
			</thead>
			<tbody>
				{#each sorted as contribution (contribution.id)}
					<tr class="border-b border-border last:border-0">
						<td class="px-4 py-3">
							{formatDate(contribution.contribution_date, settingsStore.current.ui_locale)}
						</td>
						<td class="px-4 py-3">
							{formatCurrency(contribution.amount, settingsStore.current.number_locale, settingsStore.current.currency)}
						</td>
						<td class="px-4 py-3 text-muted-foreground">
							{contribution.note || '-'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
