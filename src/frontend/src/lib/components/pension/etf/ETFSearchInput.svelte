<!--
@file src/lib/components/pension/etf/ETFSearchInput.svelte
@kind component
@purpose Kapselt den Eingabebaustein 'ETFSearchInput' im Bereich 'pension' mit Formatierungs- und Interaktionslogik.
@contains Lokaler Komponentenstatus und abgeleitete Werte werden reaktiv im Script-Block verwaltet.
@contains Kernfunktionen `handleSearchInput()`, `performSearch()`, `selectDB()`, `selectYFinance()` steuern Eingaben, Validierung und Benutzeraktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { Search, Check } from '@lucide/svelte';
	import { etfApi } from '$lib/api/etf';
	import type { ETFSearchResult, ETFYFinanceResult } from '$lib/types/etf';
	import { m } from '$lib/paraglide/messages.js';

	let {
		value = '',
		displayName = '',
		readOnly = false,
		onSelect
	}: {
		value: string;
		displayName?: string;
		readOnly?: boolean;
		onSelect: (etfId: string, name: string, symbol: string) => void;
	} = $props();

	let showPanel = $state(false);
	let searchTerm = $state('');
	let dbResults = $state<ETFSearchResult[]>([]);
	let yfinanceResults = $state<ETFYFinanceResult[]>([]);
	let loading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;
	let containerEl: HTMLDivElement;

	const shouldSearch = $derived(searchTerm.length >= 3);

	function handleSearchInput(e: Event) {
		searchTerm = (e.target as HTMLInputElement).value;
		clearTimeout(debounceTimer);
		if (searchTerm.length >= 3) {
			debounceTimer = setTimeout(performSearch, 500);
		} else {
			dbResults = [];
			yfinanceResults = [];
		}
	}

	async function performSearch() {
		loading = true;
		try {
			const [db, yf] = await Promise.allSettled([
				etfApi.search(searchTerm),
				etfApi.searchYFinance(searchTerm)
			]);
			dbResults = db.status === 'fulfilled' ? db.value : [];
			yfinanceResults = yf.status === 'fulfilled' ? yf.value : [];
		} finally {
			loading = false;
		}
	}

	function selectDB(etf: ETFSearchResult) {
		onSelect(etf.id, etf.name, etf.symbol);
		closePanel();
	}

	function selectYFinance(etf: ETFYFinanceResult) {
		const name = etf.longName || etf.shortName || etf.symbol;
		onSelect(etf.symbol, name, etf.symbol);
		closePanel();
	}

	function closePanel() {
		showPanel = false;
		searchTerm = '';
		dbResults = [];
		yfinanceResults = [];
	}

	function handleOutsideClick(e: MouseEvent) {
		if (containerEl && !containerEl.contains(e.target as Node)) {
			closePanel();
		}
	}

	$effect(() => {
		if (showPanel) {
			document.addEventListener('mousedown', handleOutsideClick);
		} else {
			document.removeEventListener('mousedown', handleOutsideClick);
		}
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	});
</script>

<div bind:this={containerEl} class="relative flex gap-2">
	{#if !readOnly}
		<button
			type="button"
			onclick={() => (showPanel = !showPanel)}
			class="flex items-center justify-center h-9 w-9 shrink-0 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
			title={m.etf_search_open()}
		>
			<Search class="h-4 w-4" />
		</button>
	{/if}

	<input
		type="text"
		readonly
		value={value ? `${displayName || value}` : ''}
		placeholder={readOnly ? '' : m.etf_search_placeholder()}
		class="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
	/>

	{#if showPanel && !readOnly}
		<div
			class="absolute left-0 top-[calc(100%+4px)] z-50 w-[420px] rounded-xl border border-border bg-popover shadow-lg"
		>
			<!-- Search input -->
			<div class="p-3 border-b border-border">
				<input
					type="text"
					value={searchTerm}
					oninput={handleSearchInput}
					placeholder={m.etf_search_min_chars()}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					autofocus
				/>
			</div>

			<!-- Results -->
			<div class="max-h-[300px] overflow-y-auto p-1">
				{#if !shouldSearch}
					<p class="px-3 py-4 text-sm text-muted-foreground text-center">
						{m.etf_search_min_chars()}
					</p>
				{:else if loading}
					<p class="px-3 py-4 text-sm text-muted-foreground text-center">
						{m.etf_search_loading()}
					</p>
				{:else if dbResults.length === 0 && yfinanceResults.length === 0}
					<p class="px-3 py-4 text-sm text-muted-foreground text-center">
						{m.etf_search_no_results()}
					</p>
				{:else}
					{#if dbResults.length > 0}
						<p class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							{m.etf_search_database_results()}
						</p>
						{#each dbResults as etf (etf.id)}
							<button
								type="button"
								onclick={() => selectDB(etf)}
								class="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted text-left transition-colors"
							>
								{#if value === etf.id}
									<Check class="h-4 w-4 shrink-0 text-primary" />
								{:else}
									<span class="h-4 w-4 shrink-0"></span>
								{/if}
								<span>{etf.symbol} - {etf.name}</span>
							</button>
						{/each}
					{/if}

					{#if yfinanceResults.length > 0}
						{#if dbResults.length > 0}
							<div class="border-t border-border my-1"></div>
						{/if}
						<p class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							{m.etf_search_yfinance_results()}
						</p>
						{#each yfinanceResults as etf (etf.symbol)}
							<button
								type="button"
								onclick={() => selectYFinance(etf)}
								class="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted text-left transition-colors"
							>
								{#if value === etf.symbol}
									<Check class="h-4 w-4 shrink-0 text-primary" />
								{:else}
									<span class="h-4 w-4 shrink-0"></span>
								{/if}
								<span>{etf.symbol} - {etf.longName || etf.shortName || etf.symbol}</span>
							</button>
						{/each}
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>
