<!--
@file src/lib/components/pension/etf/ETFSearchInput.svelte
@kind component
@purpose Kapselt den Eingabebaustein 'ETFSearchInput' im Bereich 'pension' mit Formatierungs- und Interaktionslogik.
@contains Lokaler Komponentenstatus und abgeleitete Werte werden reaktiv im Script-Block verwaltet.
@contains Kernfunktionen `handleSearchInput()`, `performSearch()`, `selectDB()`, `selectExternal()` steuern Eingaben, Validierung und Benutzeraktionen.
@contains Das Template verbindet Props/Bindings mit UI-Abschnitten, Dialogen oder Datenvisualisierung.
-->

<script lang="ts">
	import { Search, Check } from '@lucide/svelte';
	import { etfApi } from '$lib/api/etf';
	import type { ETFSearchResult } from '$lib/types/etf';
	import type { ETFSearchResultWithSource } from '$lib/types/data_source';
	import { m } from '$lib/paraglide/messages.js';

	const EXCHANGE_LABELS: Record<string, string> = {
		GER: 'XETRA',
		LSE: 'London',
		AMS: 'Amsterdam',
		PAR: 'Paris',
		MIL: 'Milan',
		SWX: 'Zürich',
		BRU: 'Brüssel',
		MAD: 'Madrid',
		HEL: 'Helsinki',
		STO: 'Stockholm',
		CPH: 'Kopenhagen',
		OSL: 'Oslo',
	};

	function exchangeLabel(code: string | null | undefined): string {
		if (!code) return '';
		return EXCHANGE_LABELS[code.toUpperCase()] ?? code;
	}

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
	let externalResults = $state<ETFSearchResultWithSource[]>([]);
	let loading = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;
	let containerEl: HTMLDivElement;
	// Race-condition guard: only the latest search may write results
	let searchCounter = 0;

	const shouldSearch = $derived(searchTerm.length >= 3);
	const yfinanceResults = $derived(externalResults.filter((r) => r.source === 'yfinance'));
	const stooqResults = $derived(externalResults.filter((r) => r.source === 'stooq'));

	function handleSearchInput(e: Event) {
		searchTerm = (e.target as HTMLInputElement).value;
		clearTimeout(debounceTimer);
		if (searchTerm.length >= 3) {
			debounceTimer = setTimeout(performSearch, 500);
		} else {
			dbResults = [];
			externalResults = [];
		}
	}

	async function performSearch() {
		const id = ++searchCounter;
		loading = true;
		const t0 = performance.now();
		console.log(`[ETFSearch] #${id} starting for: "${searchTerm}"`);
		try {
			const [db, ext] = await Promise.allSettled([
				etfApi.search(searchTerm),
				etfApi.searchExternal(searchTerm)
			]);
			// Discard stale results — a newer search has already started
			if (id !== searchCounter) {
				console.log(`[ETFSearch] #${id} discarded (superseded by #${searchCounter})`);
				return;
			}
			const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
			dbResults = db.status === 'fulfilled' ? db.value : [];
			externalResults = ext.status === 'fulfilled' ? ext.value : [];
			const yf = externalResults.filter((r) => r.source === 'yfinance').length;
			const stooq = externalResults.filter((r) => r.source === 'stooq').length;
			console.log(
				`[ETFSearch] #${id} done in ${elapsed}s — DB: ${dbResults.length}, yFinance: ${yf}, Stooq: ${stooq}`,
				db.status === 'rejected' ? `DB error: ${db.reason}` : '',
				ext.status === 'rejected' ? `Ext error: ${ext.reason}` : ''
			);
		} finally {
			if (id === searchCounter) loading = false;
		}
	}

	function selectDB(etf: ETFSearchResult) {
		onSelect(etf.id, etf.name, etf.symbol);
		closePanel();
	}

	function selectExternal(etf: ETFSearchResultWithSource) {
		const name = etf.longName || etf.shortName || etf.symbol;
		onSelect(etf.symbol, name, etf.symbol);
		closePanel();
	}

	function closePanel() {
		showPanel = false;
		searchTerm = '';
		dbResults = [];
		externalResults = [];
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
			class="absolute left-0 top-[calc(100%+4px)] z-50 w-[680px] rounded-xl border border-border bg-popover shadow-lg"
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
				{:else if dbResults.length === 0 && yfinanceResults.length === 0 && stooqResults.length === 0}
					<p class="px-3 py-4 text-sm text-muted-foreground text-center">
						{m.etf_search_no_results()}
					</p>
				{:else}
					<!-- Database results -->
					{#if dbResults.length > 0}
						<p class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							{m.etf_search_database_results()} ({dbResults.length})
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

					<!-- Yahoo Finance results -->
					{#if yfinanceResults.length > 0}
						{#if dbResults.length > 0}
							<div class="border-t border-border my-1"></div>
						{/if}
						<p class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							{m.etf_search_yfinance_results()} ({yfinanceResults.length})
						</p>
						{#each yfinanceResults as etf (etf.symbol)}
							<button
								type="button"
								onclick={() => selectExternal(etf)}
								class="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted text-left transition-colors"
							>
								{#if value === etf.symbol}
									<Check class="h-4 w-4 shrink-0 text-primary" />
								{:else}
									<span class="h-4 w-4 shrink-0"></span>
								{/if}
								<!-- Col 1: Symbol -->
								<span class="w-24 shrink-0 font-mono text-xs font-semibold">{etf.symbol}</span>
								<!-- Col 2: Name + fund_family -->
								<span class="flex-1 min-w-0 flex flex-col">
									<span class="text-sm truncate">{etf.longName || etf.shortName || etf.symbol}</span>
									{#if etf.fund_family}
										<span class="text-xs text-muted-foreground truncate">{etf.fund_family}</span>
									{/if}
								</span>
								<!-- Col 3: Category -->
								{#if etf.category}
									<span class="w-28 shrink-0 text-xs text-muted-foreground truncate">{etf.category}</span>
								{:else}
									<span class="w-28 shrink-0"></span>
								{/if}
								<!-- Col 4: Currency + Exchange -->
								<span class="w-20 shrink-0 text-right flex flex-col items-end">
									{#if etf.currency}
										<span class="text-xs text-muted-foreground">{etf.currency}</span>
									{/if}
									{#if etf.exchange}
										<span class="text-xs text-muted-foreground">{exchangeLabel(etf.exchange)}</span>
									{/if}
								</span>
							</button>
						{/each}
					{/if}

					<!-- Stooq results -->
					{#if stooqResults.length > 0}
						<div class="border-t border-border my-1"></div>
						<p class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							Stooq ({stooqResults.length})
						</p>
						{#each stooqResults as etf (etf.symbol)}
							<button
								type="button"
								onclick={() => selectExternal(etf)}
								class="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted text-left transition-colors"
							>
								{#if value === etf.symbol}
									<Check class="h-4 w-4 shrink-0 text-primary" />
								{:else}
									<span class="h-4 w-4 shrink-0"></span>
								{/if}
								<!-- Col 1: Symbol + derived badge -->
								<span class="w-24 shrink-0 flex flex-col">
									<span class="font-mono text-xs font-semibold">{etf.symbol}</span>
									{#if etf.symbol_derived}
										<span
											class="text-[10px] px-1 py-0 rounded bg-muted text-muted-foreground leading-tight w-fit"
											title={m.etf_search_symbol_derived()}
										>
											abgeleitet
										</span>
									{/if}
								</span>
								<!-- Col 2: Name + fund_family -->
								<span class="flex-1 min-w-0 flex flex-col">
									<span class="text-sm truncate">{etf.longName || etf.shortName || etf.symbol}</span>
									{#if etf.fund_family}
										<span class="text-xs text-muted-foreground truncate">{etf.fund_family}</span>
									{/if}
								</span>
								<!-- Col 3: Category -->
								{#if etf.category}
									<span class="w-28 shrink-0 text-xs text-muted-foreground truncate">{etf.category}</span>
								{:else}
									<span class="w-28 shrink-0"></span>
								{/if}
								<!-- Col 4: Currency + Exchange -->
								<span class="w-20 shrink-0 text-right flex flex-col items-end">
									{#if etf.currency}
										<span class="text-xs text-muted-foreground">{etf.currency}</span>
									{/if}
									{#if etf.exchange}
										<span class="text-xs text-muted-foreground">{exchangeLabel(etf.exchange)}</span>
									{/if}
								</span>
							</button>
						{/each}
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>
