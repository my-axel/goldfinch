<!--
@file src/lib/components/settings/DataSourceSettings.svelte
@kind component
@purpose Verwaltet Datenquellen-Konfiguration: Aktivieren/Deaktivieren, Priorität per Drag & Drop, API-Keys und Verbindungstest.
-->

<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import { dataSourcesApi } from '$lib/api/data_sources';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { DataSourceConfig } from '$lib/types/data_source';
	import { m } from '$lib/paraglide/messages.js';
	import { GripVertical, Check, X, Loader } from '@lucide/svelte';

	let {
		sources = $bindable()
	}: {
		sources: DataSourceConfig[];
	} = $props();

	// Track which source is being tested
	let testingSourceId = $state<string | null>(null);
	// Track drag state
	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	async function toggleEnabled(source: DataSourceConfig) {
		try {
			const updated = await dataSourcesApi.update(source.source_id, {
				enabled: !source.enabled
			});
			const idx = sources.findIndex((s) => s.source_id === source.source_id);
			if (idx !== -1) sources[idx] = updated;
			toastStore.success(m.data_source_enabled());
		} catch {
			toastStore.error(m.data_source_test_failed());
		}
	}

	async function saveApiKey(source: DataSourceConfig, apiKey: string) {
		try {
			const updated = await dataSourcesApi.update(source.source_id, { api_key: apiKey });
			const idx = sources.findIndex((s) => s.source_id === source.source_id);
			if (idx !== -1) sources[idx] = updated;
			toastStore.success(m.data_source_enabled());
		} catch {
			toastStore.error(m.data_source_test_failed());
		}
	}

	async function testConnection(source: DataSourceConfig) {
		testingSourceId = source.source_id;
		try {
			const result = await dataSourcesApi.test(source.source_id);
			if (result.success) {
				toastStore.success(m.data_source_test_success());
			} else {
				toastStore.error(m.data_source_test_failed());
			}
		} catch {
			toastStore.error(m.data_source_test_failed());
		} finally {
			testingSourceId = null;
		}
	}

	// --- Drag & Drop ---

	function handleDragStart(index: number) {
		dragIndex = index;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverIndex = index;
	}

	function handleDragEnd() {
		if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
			dragIndex = null;
			dragOverIndex = null;
			return;
		}

		// Reorder the sources array
		const reordered = [...sources];
		const [moved] = reordered.splice(dragIndex, 1);
		reordered.splice(dragOverIndex, 0, moved);

		// Assign new priorities based on new order (10, 20, 30, ...)
		const priorities = reordered.map((s, i) => ({
			source_id: s.source_id,
			priority: (i + 1) * 10
		}));

		// Optimistic update
		sources = reordered.map((s, i) => ({ ...s, priority: (i + 1) * 10 }));

		dragIndex = null;
		dragOverIndex = null;

		// Persist to backend
		dataSourcesApi.updatePriorities(priorities).catch(() => {
			toastStore.error(m.data_source_test_failed());
		});
	}
</script>

<Card title={m.settings_data_sources_title()} description={m.settings_data_sources_description()}>
	<ul class="space-y-2">
		{#each sources as source, i (source.source_id)}
			<li
				class="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 transition-colors {dragOverIndex === i ? 'border-primary bg-primary/5' : ''}"
				draggable="true"
				ondragstart={() => handleDragStart(i)}
				ondragover={(e) => handleDragOver(e, i)}
				ondragend={handleDragEnd}
				role="listitem"
			>
				<!-- Drag handle -->
				<span
					class="cursor-grab text-muted-foreground hover:text-foreground"
					title={m.data_source_drag_hint()}
				>
					<GripVertical class="h-4 w-4" />
				</span>

				<!-- Enable/Disable toggle -->
				<button
					type="button"
					onclick={() => toggleEnabled(source)}
					class="shrink-0 flex items-center justify-center h-5 w-5 rounded border transition-colors {source.enabled
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-border bg-background'}"
					title={source.enabled ? m.data_source_enabled() : m.data_source_disabled()}
				>
					{#if source.enabled}
						<Check class="h-3 w-3" />
					{/if}
				</button>

				<!-- Source name + badges -->
				<div class="flex-1 min-w-0">
					<span class="text-sm font-medium">{source.name}</span>
					<div class="flex gap-2 mt-0.5">
						{#if !source.requires_api_key}
							<span class="text-xs text-muted-foreground">{m.data_source_no_key_required()}</span>
						{/if}
						{#if !source.supports_search}
							<span class="text-xs text-muted-foreground"
								>· {m.data_source_search_not_supported()}</span
							>
						{/if}
					</div>
				</div>

				<!-- API Key input (only for sources that require a key) -->
				{#if source.requires_api_key}
					<input
						type="password"
						value={source.api_key ?? ''}
						placeholder={m.data_source_api_key_placeholder()}
						onchange={(e) => saveApiKey(source, (e.target as HTMLInputElement).value)}
						class="w-36 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
					/>
				{/if}

				<!-- Test button -->
				<button
					type="button"
					onclick={() => testConnection(source)}
					disabled={testingSourceId === source.source_id}
					class="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-50"
				>
					{#if testingSourceId === source.source_id}
						<Loader class="h-3 w-3 animate-spin" />
					{/if}
					{m.data_source_test()}
				</button>
			</li>
		{/each}
	</ul>
</Card>
