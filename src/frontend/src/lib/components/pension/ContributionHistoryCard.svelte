<!--
@file src/lib/components/pension/ContributionHistoryCard.svelte
@kind component
@purpose Zeigt die Beitragshistorie eines Pensionsplans nach Jahren gruppiert mit ein-/ausklappbaren Jahresgruppen an.
-->

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { m } from '$lib/paraglide/messages.js';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { formatCurrency } from '$lib/utils/format';
	import { compareIsoDate } from '$lib/utils/date-only';
	import Card from '$lib/components/ui/Card.svelte';
	import { ChevronUp, ChevronDown } from '@lucide/svelte';

	interface ContributionEntry {
		contribution_date: string;
		amount: number;
		note?: string;
		is_manual?: boolean;
	}

	let {
		contributions,
		headerActions: headerActionsSlot
	}: {
		contributions: ContributionEntry[];
		headerActions?: Snippet;
	} = $props();

	interface YearGroup {
		year: number;
		entries: ContributionEntry[];
		total: number;
	}

	const yearGroups = $derived.by((): YearGroup[] => {
		if (contributions.length === 0) return [];

		const sorted = [...contributions].sort((a, b) =>
			compareIsoDate(b.contribution_date, a.contribution_date)
		);

		const map = new SvelteMap<number, ContributionEntry[]>();
		for (const entry of sorted) {
			const year = new Date(entry.contribution_date).getFullYear();
			if (!map.has(year)) map.set(year, []);
			map.get(year)!.push(entry);
		}

		return [...map.entries()]
			.sort(([a], [b]) => b - a)
			.map(([year, entries]) => ({
				year,
				entries,
				total: entries.reduce((sum, e) => sum + Number(e.amount), 0)
			}));
	});

	// Tracks years the user has explicitly toggled from their default state.
	// Default: newest year is open, all others are closed.
	// If a year is in this set and is the newest → user closed it (now closed).
	// If a year is in this set and is NOT the newest → user opened it (now open).
	const toggledYears = new SvelteSet<number>();

	function isYearOpen(year: number): boolean {
		const isToggled = toggledYears.has(year);
		const isNewest = yearGroups.length > 0 && yearGroups[0].year === year;
		return isNewest ? !isToggled : isToggled;
	}

	function toggleYear(year: number) {
		if (toggledYears.has(year)) {
			toggledYears.delete(year);
		} else {
			toggledYears.add(year);
		}
	}

	function formatDayMonth(dateStr: string, locale: string): string {
		return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
	}
</script>

<Card title={m.contribution_history_title()}>
	{#snippet headerActions()}
		{@render headerActionsSlot?.()}
	{/snippet}
	{#if yearGroups.length === 0}
		<p class="text-sm text-muted-foreground py-2">{m.contribution_history_empty()}</p>
	{:else}
		<div class="divide-y divide-border -mx-4 -mb-4">
			{#each yearGroups as group (group.year)}
				<div>
					<!-- Year header -->
					<button
						type="button"
						onclick={() => toggleYear(group.year)}
						class="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
					>
						<div class="flex items-center gap-3">
							<span class="font-semibold text-foreground">{group.year}</span>
							<span class="text-muted-foreground"
								>{m.contribution_history_entries({ count: group.entries.length })}</span
							>
						</div>
						<div class="flex items-center gap-3">
							<span class="font-medium text-foreground">
								{formatCurrency(
									group.total,
									settingsStore.current.number_locale,
									settingsStore.current.currency
								)}
							</span>
							<span class="text-muted-foreground">
								{#if isYearOpen(group.year)}
									<ChevronUp size={16} />
								{:else}
									<ChevronDown size={16} />
								{/if}
							</span>
						</div>
					</button>

					<!-- Year entries -->
					{#if isYearOpen(group.year)}
						<div class="border-t border-border/50">
							<table class="w-full text-sm">
								<thead>
									<tr class="bg-muted/50">
										<th
											class="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
											>{m.contribution_history_date()}</th
										>
										<th
											class="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
											>{m.contribution_amount()}</th
										>
										<th
											class="px-4 py-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
											>{m.contribution_history_note()}</th
										>
									</tr>
								</thead>
								<tbody>
									{#each group.entries as entry, i (`${group.year}-${i}`)}
										<tr class="border-t border-border/30 hover:bg-muted/20 transition-colors">
											<td class="px-4 py-2 tabular-nums">
												{formatDayMonth(entry.contribution_date, settingsStore.current.ui_locale)}
											</td>
											<td class="px-4 py-2 tabular-nums">
												{formatCurrency(
													Number(entry.amount),
													settingsStore.current.number_locale,
													settingsStore.current.currency
												)}
											</td>
											<td class="px-4 py-2 text-muted-foreground">
												{entry.note || '–'}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</Card>
